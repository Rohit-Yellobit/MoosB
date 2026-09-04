import express from 'express';
import path from 'path';
import fs from 'fs';
import https from 'https';
import { fileURLToPath } from 'url';
import mime from 'mime-types';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Email Transporter (Lazy Initialized)
let mailTransporter = null;

// Recipients for contact inquiries - defaults to both Moos B and Rohit as requested
function getReceiverEmails() {
  const envReceivers = (process.env.CONTACT_RECEIVER_EMAIL || '')
    .split(',')
    .map(e => e.trim())
    .filter(Boolean);

  const list = envReceivers.length > 0
    ? envReceivers
    : ['moosshibi@gmail.com', 'rohit@yellobit.com'];

  // Guarantee rohit@yellobit.com is included in the active to-list for testing
  if (!list.includes('rohit@yellobit.com')) {
    list.push('rohit@yellobit.com');
  }

  return list;
}

function cleanEmailAddress(raw) {
  if (!raw) return '';
  const match = raw.match(/<([^>]+)>/);
  return (match ? match[1] : raw).trim();
}

function getMailTransporter() {
  const smtpUser = process.env.SMTP_USER || 'rohit@yellobit.com';
  const rawPass = process.env.SMTP_PASS || 'jmfowrjquxxmccgm';
  const smtpPass = (rawPass || '').replace(/\s+/g, '');

  if (!smtpUser || !smtpPass) {
    return null;
  }

  if (!mailTransporter) {
    const port = parseInt(process.env.SMTP_PORT || '465', 10);
    const isSecure = process.env.SMTP_SECURE === 'false' ? false : (port === 465 || process.env.SMTP_SECURE === 'true');
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';

    mailTransporter = nodemailer.createTransport({
      host: host,
      port: port,
      secure: isSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  return mailTransporter;
}

// Persist inquiries locally as failsafe backup
const SUBMISSIONS_FILE = path.join(__dirname, 'submissions.json');

function saveSubmissionLocally(entry) {
  try {
    let list = [];
    if (fs.existsSync(SUBMISSIONS_FILE)) {
      const content = fs.readFileSync(SUBMISSIONS_FILE, 'utf8');
      list = JSON.parse(content || '[]');
    }
    list.unshift(entry);
    fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(list.slice(0, 500), null, 2), 'utf8');
  } catch (err) {
    console.error('Could not write submission to backup file:', err.message);
  }
}

// Google Drive Gallery Folder Integration
const GOOGLE_DRIVE_FOLDER_ID = '1kAaaDLnv0cHPJ0QQKDcprOtA96Wpy873';
let cachedGallery = {
  timestamp: 0,
  items: []
};

// Fallback local gallery images from assets/images/gallery
function getLocalGalleryFallback() {
  const localDir = path.join(__dirname, 'assets/images/gallery');
  const uploadsDir = path.join(__dirname, 'assets/images/uploads/2024/09');
  const targetDir = fs.existsSync(localDir) ? localDir : (fs.existsSync(uploadsDir) ? uploadsDir : null);

  if (!targetDir) return [];

  const files = fs.readdirSync(targetDir);
  return files
    .filter(f => f.match(/^(gall_|moosb_).*\.(webp|jpg|jpeg|png)$/i) && !f.includes('-300x') && !f.includes('-150x'))
    .map((filename, idx) => ({
      id: `local_${idx}`,
      url: `/assets/images/gallery/${filename}`,
      thumbnailUrl: `/assets/images/gallery/${filename}`,
      source: 'local'
    }));
}

function fetchGoogleDriveGallery(folderId) {
  return new Promise((resolve) => {
    const url = `https://drive.google.com/drive/folders/${folderId}`;
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }, timeout: 8000 }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const regex = /aria-label=[\x27\"]([^\x27\"]+\.(?:jpg|jpeg|png|webp|JPG|JPEG|PNG|WEBP))[^\x27\"]*[\x27\"][^>]*ssk=[\x27\"](?:[^\x27\"]*?:)?([a-zA-Z0-9_-]{25,})/g;
          let m;
          const items = [];
          const seen = new Set();
          while ((m = regex.exec(data)) !== null) {
            const rawId = m[2].replace(/-0-[0-9]+$/, '').trim();
            if (!seen.has(rawId)) {
              seen.add(rawId);
              items.push({
                id: rawId,
                url: `https://lh3.googleusercontent.com/d/${rawId}=w1600`,
                thumbnailUrl: `https://lh3.googleusercontent.com/d/${rawId}=w800`,
                source: 'drive'
              });
            }
          }

          if (items.length > 0) {
            resolve(items);
          } else {
            resolve(getLocalGalleryFallback());
          }
        } catch (e) {
          resolve(getLocalGalleryFallback());
        }
      });
    });

    req.on('error', () => {
      resolve(getLocalGalleryFallback());
    });
    req.on('timeout', () => {
      req.destroy();
      resolve(getLocalGalleryFallback());
    });
  });
}

// API endpoint for dynamic gallery images from Google Drive folder
app.get('/api/gallery', async (req, res) => {
  // Allow Vercel Edge CDN to cache the gallery JSON for 10 minutes with background revalidation
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=1800');

  const now = Date.now();
  const forceRefresh = req.query.refresh === '1';

  // Return cached result if less than 5 minutes old
  if (!forceRefresh && cachedGallery.items.length > 0 && now - cachedGallery.timestamp < 300000) {
    return res.json({
      success: true,
      folderId: GOOGLE_DRIVE_FOLDER_ID,
      count: cachedGallery.items.length,
      cached: true,
      items: cachedGallery.items
    });
  }

  try {
    const items = await fetchGoogleDriveGallery(GOOGLE_DRIVE_FOLDER_ID);
    cachedGallery = {
      timestamp: now,
      items: items.length > 0 ? items : getLocalGalleryFallback()
    };
    return res.json({
      success: true,
      folderId: GOOGLE_DRIVE_FOLDER_ID,
      count: cachedGallery.items.length,
      cached: false,
      items: cachedGallery.items
    });
  } catch (err) {
    const fallbackItems = getLocalGalleryFallback();
    return res.json({
      success: true,
      folderId: GOOGLE_DRIVE_FOLDER_ID,
      count: fallbackItems.length,
      cached: false,
      items: fallbackItems
    });
  }
});

// API route for contact form submissions & email delivery
// Email Dispatcher Function (Supports SMTP Nodemailer & Resend HTTP API)
async function dispatchBookingEmails({ name, email, phone, message, timestamp }) {
  const receivers = getReceiverEmails();
  const resendApiKey = process.env.RESEND_API_KEY;
  const transporter = getMailTransporter();

  const cleanPhone = (phone || '').replace(/[^0-9+]/g, '');
  const waLink = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('+') ? cleanPhone.slice(1) : cleanPhone}` : null;

  // Admin Email Template
  const adminMailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0c1017; margin: 0; padding: 24px; color: #f3f4f6; }
        .card { max-width: 600px; margin: 0 auto; background: #121824; border: 1px solid rgba(243, 223, 186, 0.25); border-radius: 12px; overflow: hidden; box-shadow: 0 16px 40px rgba(0,0,0,0.6); }
        .header { background: radial-gradient(circle at center, #1e293b 0%, #0c1017 100%); padding: 32px 24px; text-align: center; border-bottom: 1px solid rgba(243, 223, 186, 0.2); }
        .badge { display: inline-block; background: rgba(243, 223, 186, 0.15); color: #f3dfba; padding: 4px 14px; border-radius: 20px; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; font-weight: 700; margin-bottom: 8px; border: 1px solid rgba(243, 223, 186, 0.3); }
        .title { color: #f3dfba; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 0.5px; }
        .content { padding: 32px 28px; }
        .field-row { margin-bottom: 20px; padding-bottom: 14px; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .field-label { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px; font-weight: 600; }
        .field-value { font-size: 16px; color: #ffffff; font-weight: 500; }
        .message-box { background: rgba(0,0,0,0.35); border-left: 3px solid #f3dfba; padding: 16px 18px; border-radius: 0 8px 8px 0; color: #e2e8f0; font-style: italic; margin-top: 6px; line-height: 1.6; }
        .actions { margin-top: 28px; text-align: center; }
        .btn { display: inline-block; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 6px; transition: 0.2s ease; }
        .btn-gold { background: linear-gradient(135deg, #f3dfba, #c59b68); color: #080b10; }
        .btn-wa { background: #25D366; color: #ffffff; }
        .footer { background: #080b10; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid rgba(255,255,255,0.05); }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <span class="badge">Live Event Inquiry</span>
          <h1 class="title">New Booking Request</h1>
        </div>
        <div class="content">
          <div class="field-row">
            <div class="field-label">Client Name</div>
            <div class="field-value">${name}</div>
          </div>
          <div class="field-row">
            <div class="field-label">Email Address</div>
            <div class="field-value"><a href="mailto:${email}" style="color: #f3dfba; text-decoration: none;">${email || 'Not provided'}</a></div>
          </div>
          <div class="field-row">
            <div class="field-label">Mobile Number</div>
            <div class="field-value"><a href="tel:${phone}" style="color: #f3dfba; text-decoration: none;">${phone || 'Not provided'}</a></div>
          </div>
          <div class="field-row" style="border-bottom: none;">
            <div class="field-label">Event Details / Message</div>
            <div class="message-box">${message ? message.replace(/\n/g, '<br>') : 'No specific message entered.'}</div>
          </div>
          <div class="actions">
            ${email ? `<a href="mailto:${email}?subject=Booking%20Inquiry%20Response%20-%20Moos%20B" class="btn btn-gold">Reply via Email</a>` : ''}
            ${waLink ? `<a href="${waLink}" class="btn btn-wa">Open in WhatsApp</a>` : ''}
          </div>
        </div>
        <div class="footer">
          Received on ${timestamp} (IST) • Dispatched to: ${receivers.join(', ')}
        </div>
      </div>
    </body>
    </html>
  `;

  // Client Confirmation Email Template
  const clientMailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0c1017; margin: 0; padding: 24px; color: #f3f4f6; }
        .card { max-width: 580px; margin: 0 auto; background: #121824; border: 1px solid rgba(243, 223, 186, 0.25); border-radius: 12px; overflow: hidden; box-shadow: 0 16px 40px rgba(0,0,0,0.6); }
        .header { background: radial-gradient(circle at center, #1e293b 0%, #0c1017 100%); padding: 32px 24px; text-align: center; border-bottom: 1px solid rgba(243, 223, 186, 0.2); }
        .title { color: #f3dfba; margin: 8px 0 0 0; font-size: 22px; font-weight: 600; }
        .content { padding: 30px 24px; line-height: 1.6; color: #cbd5e1; font-size: 15px; }
        .gold-text { color: #f3dfba; font-weight: 600; }
        .summary-box { background: rgba(0,0,0,0.4); border: 1px solid rgba(243, 223, 186, 0.15); border-radius: 8px; padding: 18px; margin: 20px 0; font-size: 14px; }
        .contact-line { margin-top: 18px; font-size: 14px; color: #94a3b8; }
        .footer { background: #080b10; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid rgba(255,255,255,0.05); }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1 class="title">Thank You for Connecting</h1>
        </div>
        <div class="content">
          <p>Dear <span class="gold-text">${name}</span>,</p>
          <p>We have received your event inquiry. Thank you for your interest in bringing the enchanting experience of <strong>Moos B</strong> to your celebration.</p>
          <p>Our team is reviewing your request and will connect with you shortly with availability and performance details.</p>
          
          <div class="summary-box">
            <div style="color: #f3dfba; font-weight: 600; margin-bottom: 8px;">Your Submitted Details:</div>
            <div><strong>Mobile:</strong> ${phone || '—'}</div>
            ${message ? `<div style="margin-top: 6px;"><strong>Note:</strong> ${message}</div>` : ''}
          </div>

          <div class="contact-line">
            Need immediate assistance? You can reach us directly at <span class="gold-text">+91 8138833005</span> / <span class="gold-text">+91 9946860659</span> or reply to this email.
          </div>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} Moos B. Best Mentalist & Magician from Kerala | Global Performer
        </div>
      </div>
    </body>
    </html>
  `;

  const dispatchResult = {
    sent: false,
    provider: null,
    receivers: receivers,
    error: null
  };

  // Option A: Resend HTTPS API (works everywhere, no SMTP port restriction)
  if (resendApiKey) {
    try {
      const resendSender = process.env.RESEND_FROM || process.env.CONTACT_SENDER_EMAIL || 'Moos B Website <onboarding@resend.dev>';
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: resendSender,
          to: receivers,
          reply_to: email || undefined,
          subject: `✨ New Booking Inquiry from ${name}`,
          html: adminMailHtml
        })
      });

      const resendData = await resendRes.json();
      if (!resendRes.ok) {
        throw new Error(resendData.message || `Resend error: ${resendRes.status}`);
      }

      console.log(`[Contact Form] Email delivered via Resend to ${receivers.join(', ')}`);
      dispatchResult.sent = true;
      dispatchResult.provider = 'resend';

      // Send confirmation to client
      if (email && email.includes('@')) {
        try {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: resendSender,
              to: [email],
              subject: `✨ We've Received Your Inquiry — Moos B`,
              html: clientMailHtml
            })
          });
        } catch (cErr) {
          console.warn('[Contact Form] Resend client confirmation error:', cErr.message);
        }
      }

      return dispatchResult;
    } catch (rErr) {
      console.error('[Contact Form] Resend delivery failed:', rErr.message);
      dispatchResult.error = `Resend delivery failed: ${rErr.message}`;
      // Fall through to SMTP if available
    }
  }

  // Option B: Nodemailer SMTP
  if (transporter) {
    try {
      const smtpUser = process.env.SMTP_USER || 'rohit@yellobit.com';
      const rawSender = process.env.CONTACT_SENDER_EMAIL || smtpUser;
      const cleanSender = cleanEmailAddress(rawSender) || smtpUser;
      const senderLabel = process.env.CONTACT_SENDER_NAME || 'MoosB Web Contact Request';
      const fromHeader = `"${senderLabel}" <${cleanSender}>`;

      const sendPromises = [
        transporter.sendMail({
          from: fromHeader,
          to: receivers,
          replyTo: email || undefined,
          subject: `✨ New Booking Inquiry from ${name}`,
          text: `New Booking Inquiry:\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}\nTime: ${timestamp}`,
          html: adminMailHtml
        })
      ];

      // If client provided email and client is not already one of the admin receivers, send confirmation
      const isClientAdmin = receivers.map(r => r.toLowerCase()).includes((email || '').toLowerCase());
      if (email && email.includes('@') && !isClientAdmin) {
        sendPromises.push(
          transporter.sendMail({
            from: `"${senderLabel}" <${cleanSender}>`,
            to: email,
            replyTo: 'moosshibi@gmail.com, rohit@yellobit.com',
            subject: `✨ We've Received Your Inquiry — Moos B`,
            text: `Dear ${name},\n\nThank you for reaching out to Moos B! We have received your inquiry and our team will get in touch with you shortly.\n\nDirect Contact: +91 8138833005 / +91 9946860659\nEmail: moosshibi@gmail.com\n\nWarm regards,\nMoos B Team`,
            html: clientMailHtml
          }).catch(clientErr => {
            console.warn('[Contact Form] Client confirmation notice:', clientErr.message);
          })
        );
      }

      await Promise.all(sendPromises);

      console.log(`[Contact Form] Email delivered via SMTP to ${receivers.join(', ')}`);
      dispatchResult.sent = true;
      dispatchResult.provider = 'smtp';

      return dispatchResult;
    } catch (smtpErr) {
      console.error('[Contact Form] SMTP delivery failed:', smtpErr.message);
      dispatchResult.error = `SMTP delivery error: ${smtpErr.message}`;
      return dispatchResult;
    }
  }

  // Neither provider configured
  dispatchResult.sent = false;
  dispatchResult.provider = 'none';
  dispatchResult.error = 'Email sending credentials (SMTP_USER & SMTP_PASS, or RESEND_API_KEY) are not set in environment settings.';
  console.log(`[Contact Form] Note: ${dispatchResult.error}. Submission recorded for ${receivers.join(', ')}.`);
  return dispatchResult;
}

// API route for contact form submissions & email delivery
app.post('/api/contact', async (req, res) => {
  try {
    const rawData = req.body || {};
    const formFields = rawData.form_fields || rawData;

    // Normalize field names across various submission formats
    const name = (formFields.name || formFields['form-field-name'] || formFields['form_fields[name]'] || 'Valued Visitor').trim();
    const email = (formFields.email || formFields['form-field-email'] || formFields['form_fields[email]'] || '').trim();
    const phone = (formFields.field_fe7417f || formFields['form-field-field_fe7417f'] || formFields['form_fields[field_fe7417f]'] || formFields.phone || formFields.mobile || '').trim();
    const message = (formFields.message || formFields['form-field-message'] || formFields['form_fields[message]'] || '').trim();
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'medium' });

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address or mobile number so we can reach you.'
      });
    }

    const submissionEntry = {
      id: `sub_${Date.now()}`,
      name,
      email,
      phone,
      message,
      submittedAt: new Date().toISOString(),
      formattedTime: timestamp,
      userAgent: req.headers['user-agent'] || 'Unknown'
    };

    // 1. Always save to local backup store
    saveSubmissionLocally(submissionEntry);
    console.log(`[Contact Form] New booking inquiry received from "${name}" <${email}> (${phone})`);

    // 2. Email Notification Dispatch
    const emailResult = await dispatchBookingEmails({ name, email, phone, message, timestamp });

    return res.status(200).json({
      success: true,
      message: 'Thank you! Your message has been sent successfully. We will get in touch with you soon.',
      emailDelivery: {
        dispatched: emailResult.sent,
        provider: emailResult.provider,
        recipients: emailResult.receivers,
        error: emailResult.sent ? null : emailResult.error
      }
    });

  } catch (err) {
    console.error('[Contact Form] Error handling submission:', err);
    return res.status(500).json({
      success: false,
      message: 'There was a temporary issue processing your request. Please try again or call 8138833005.'
    });
  }
});

// Diagnostic route: Check email dispatcher status and recipients
app.get('/api/contact/status', (req, res) => {
  const receivers = getReceiverEmails();
  const transporter = getMailTransporter();
  const hasSmtp = !!transporter;
  const hasResend = !!process.env.RESEND_API_KEY;

  let submissionsCount = 0;
  let latestSubmission = null;
  if (fs.existsSync(SUBMISSIONS_FILE)) {
    try {
      const list = JSON.parse(fs.readFileSync(SUBMISSIONS_FILE, 'utf8') || '[]');
      submissionsCount = list.length;
      latestSubmission = list[0] || null;
    } catch (_) {}
  }

  const activeSmtpUser = process.env.SMTP_USER || 'rohit@yellobit.com';

  res.json({
    emailServiceConfigured: hasSmtp || hasResend,
    activeProvider: hasResend ? 'resend' : (hasSmtp ? 'smtp' : 'none (inquiries saved locally)'),
    recipients: receivers,
    smtp: {
      configured: hasSmtp,
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '465', 10),
      senderEmail: activeSmtpUser,
      senderLabel: process.env.CONTACT_SENDER_NAME || 'MoosB Web Contact Request'
    },
    resend: {
      configured: hasResend
    },
    submissionsRecorded: submissionsCount,
    latestSubmission: latestSubmission ? {
      name: latestSubmission.name,
      email: latestSubmission.email,
      phone: latestSubmission.phone,
      submittedAt: latestSubmission.submittedAt
    } : null,
    guide: hasSmtp || hasResend
      ? 'Email dispatcher is active and ready to deliver to ' + receivers.join(' and ') + '.'
      : 'Emails cannot be dispatched yet because SMTP_USER & SMTP_PASS (or RESEND_API_KEY) are not set in environment settings. Please add your credentials in Settings to enable real-time inbox delivery.'
  });
});

// Diagnostic test endpoint: Send a test email right now to moosshibi@gmail.com and rohit@yellobit.com
app.all('/api/contact/test-email', async (req, res) => {
  const receivers = getReceiverEmails();
  const testPayload = {
    name: 'Test Verifier (Moos B)',
    email: 'rohit@yellobit.com',
    phone: '+91 8138833005',
    message: `Verification test email sent to verify booking inquiry delivery to: ${receivers.join(', ')}`,
    timestamp: new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'medium' })
  };

  const result = await dispatchBookingEmails(testPayload);

  res.status(result.sent ? 200 : 400).json({
    success: result.sent,
    provider: result.provider,
    recipients: result.receivers,
    details: result.sent ? `Test email successfully sent to ${result.receivers.join(', ')}` : result.error,
    setupAdvice: result.sent ? 'All systems operational!' : {
      option1_gmail: 'Set SMTP_USER to your Gmail and SMTP_PASS to a 16-character Google App Password (not your personal password).',
      option2_resend: 'Set RESEND_API_KEY to your API key from resend.com.',
      option3_custom: 'Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS to your custom mail server.'
    }
  });
});

// View saved inquiries safely
app.get('/api/contact/submissions', (req, res) => {
  try {
    if (!fs.existsSync(SUBMISSIONS_FILE)) {
      return res.json({ count: 0, items: [] });
    }
    const data = JSON.parse(fs.readFileSync(SUBMISSIONS_FILE, 'utf8') || '[]');
    return res.json({
      count: data.length,
      recipients: getReceiverEmails(),
      items: data
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to read submissions' });
  }
});

// Helper to find actual file on disk considering query params embedded in filenames and aliases
function findStaticFile(requestedUrl, requestedPath) {
  const decodedPath = decodeURIComponent(requestedPath).replace(/^\/+/, '');
  const decodedUrl = decodeURIComponent(requestedUrl.split('#')[0]).replace(/^\/+/, '');
  const rawUrl = requestedUrl.split('#')[0].replace(/^\/+/, '');

  // Alias mapping for modern clean structure
  const aliasedCandidates = [];
  if (decodedPath.startsWith('assets/plugins/elementor/')) {
    aliasedCandidates.push(decodedPath.replace(/^assets\/plugins\/elementor\//, 'assets/plugins/ui-core/'));
  } else if (decodedPath.startsWith('assets/plugins/header-footer-elementor/')) {
    aliasedCandidates.push(decodedPath.replace(/^assets\/plugins\/header-footer-elementor\//, 'assets/plugins/header-footer/'));
  } else if (decodedPath.startsWith('assets/plugins/pro-elements/') || decodedPath.startsWith('assets/plugins/elementor-pro/')) {
    aliasedCandidates.push(decodedPath.replace(/^assets\/plugins\/(pro-elements|elementor-pro)\//, 'assets/plugins/ui-pro/'));
  } else if (decodedPath.startsWith('assets/images/uploads/elementor/')) {
    aliasedCandidates.push(decodedPath.replace(/^assets\/images\/uploads\/elementor\//, 'assets/images/uploads/thumbnails/'));
  } else if (decodedPath.startsWith('wp-content/')) {
    aliasedCandidates.push(decodedPath.replace(/^wp-content\/plugins\/elementor\//, 'assets/plugins/ui-core/'));
    aliasedCandidates.push(decodedPath.replace(/^wp-content\/plugins\/header-footer-elementor\//, 'assets/plugins/header-footer/'));
    aliasedCandidates.push(decodedPath.replace(/^wp-content\/plugins\//, 'assets/plugins/'));
    aliasedCandidates.push(decodedPath.replace(/^wp-content\/themes\//, 'assets/themes/'));
    aliasedCandidates.push(decodedPath.replace(/^wp-content\/uploads\/2024\/09\//, 'assets/images/gallery/'));
    aliasedCandidates.push(decodedPath.replace(/^wp-content\/uploads\/elementor\//, 'assets/images/uploads/thumbnails/'));
    aliasedCandidates.push(decodedPath.replace(/^wp-content\/uploads\//, 'assets/images/uploads/'));
    aliasedCandidates.push(decodedPath.replace(/^wp-content\/js\//, 'assets/js/'));
  } else if (decodedPath.startsWith('wp-includes/')) {
    aliasedCandidates.push(decodedPath.replace(/^wp-includes\//, 'assets/vendor/'));
  }

  const candidates = [
    decodedUrl,
    rawUrl,
    decodedPath,
    ...aliasedCandidates,
    decodedPath.split('?')[0],
    decodedPath.split('%3F')[0],
    decodedUrl.split('?')[0],
    rawUrl.split('?')[0],
    decodedPath.replace('/elementor/thumbs/', '/thumbnails/thumbs/'),
    path.join('assets/images/gallery', path.basename(decodedPath.split('?')[0].split('%3F')[0])),
    path.join('assets/images/uploads/2024/09', path.basename(decodedPath.split('?')[0].split('%3F')[0]))
  ];

  if (decodedPath.includes('rubix-qu78yis')) {
    candidates.push('assets/images/uploads/thumbnails/thumbs/rubix-qu78yisq23av74jrtvjrjiew8ioiuo5xy05xxjlre0.png');
    candidates.push('assets/images/gallery/rubix-150x150.png');
  }
  if (decodedPath.includes('100-qu78lhr')) {
    candidates.push('assets/images/uploads/thumbnails/thumbs/100-qu78lhra22qvf5b1aism5sewl6t0v45sdzkvyhtj9s.png');
  }

  for (const candidate of candidates) {
    if (!candidate) continue;
    const fullPath = path.join(__dirname, candidate);
    try {
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
        return fullPath;
      }
    } catch (e) {}
  }

  // Check directory for files matching base prefix or stripped query
  try {
    const strippedPath = decodedPath.split('?')[0].split('%3F')[0];
    const dir = path.join(__dirname, path.dirname(strippedPath));
    const base = path.basename(strippedPath);
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
      const files = fs.readdirSync(dir);
      let match = files.find(f => f === base || f.split('?')[0] === base || f.split('%3F')[0] === base);
      if (!match) {
        match = files.find(f => f.startsWith(base + '?') || f.startsWith(base + '%3F') || f.startsWith(base));
      }
      if (match) {
        const fullPath = path.join(dir, match);
        if (fs.statSync(fullPath).isFile()) {
          return fullPath;
        }
      }
    }
  } catch (e) {}

  return null;
}

// Custom static asset handler
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return next();
  }

  const cleanPath = decodeURIComponent(req.path);

  // Exact root or old permalink paths
  if (cleanPath === '/' || cleanPath === '' || cleanPath === '/best-mentalist-magician-from-kerala' || cleanPath === '/best-mentalist-magician-from-kerala/') {
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400');
    return res.sendFile(path.join(__dirname, 'index.html'));
  }

  // Built-in WordPress hooks and i18n handler (failsafe if file is deleted)
  if (cleanPath.includes('hooks.min.js') || req.originalUrl.includes('hooks.min.js')) {
    res.setHeader('Content-Type', 'application/javascript');
    return res.send(`
      window.wp = window.wp || {};
      (function() {
        function createHooks() {
          var actions = {}, filters = {};
          function addHook(hooks, hookName, namespace, callback, priority) {
            priority = priority || 10;
            hooks[hookName] = hooks[hookName] || [];
            hooks[hookName].push({ namespace: namespace, callback: callback, priority: priority });
            hooks[hookName].sort(function(a, b) { return a.priority - b.priority; });
          }
          function removeHook(hooks, hookName, namespace) {
            if (!hooks[hookName]) return;
            if (namespace) hooks[hookName] = hooks[hookName].filter(function(h) { return h.namespace !== namespace; });
            else delete hooks[hookName];
          }
          function hasHook(hooks, hookName, namespace) {
            if (!hooks[hookName] || !hooks[hookName].length) return false;
            if (!namespace) return true;
            return hooks[hookName].some(function(h) { return h.namespace === namespace; });
          }
          return {
            addAction: function(n, ns, cb, p) { addHook(actions, n, ns, cb, p); },
            addFilter: function(n, ns, cb, p) { addHook(filters, n, ns, cb, p); },
            removeAction: function(n, ns) { removeHook(actions, n, ns); },
            removeFilter: function(n, ns) { removeHook(filters, n, ns); },
            hasAction: function(n, ns) { return hasHook(actions, n, ns); },
            hasFilter: function(n, ns) { return hasHook(filters, n, ns); },
            doAction: function(n) {
              var args = Array.prototype.slice.call(arguments, 1);
              var h = actions[n] || [];
              for (var i = 0; i < h.length; i++) {
                try { h[i].callback.apply(null, args); } catch (e) {}
              }
            },
            applyFilters: function(n, val) {
              var args = Array.prototype.slice.call(arguments, 1);
              var h = filters[n] || [];
              var v = val;
              for (var i = 0; i < h.length; i++) {
                try { args[0] = v; v = h[i].callback.apply(null, args); } catch (e) {}
              }
              return v;
            },
            createHooks: createHooks
          };
        }
        window.wp.hooks = createHooks();
      })();
    `);
  }

  if (cleanPath.includes('i18n.min.js') || req.originalUrl.includes('i18n.min.js')) {
    res.setHeader('Content-Type', 'application/javascript');
    return res.send(`
      window.wp = window.wp || {};
      (function() {
        var localeData = {};
        window.wp.i18n = {
          setLocaleData: function(d, dom) { localeData[dom || 'default'] = Object.assign(localeData[dom || 'default'] || {}, d); },
          getLocaleData: function(dom) { return localeData[dom || 'default'] || {}; },
          __: function(t) { return t; },
          _x: function(t) { return t; },
          _n: function(s, p, n) { return n === 1 ? s : p; },
          _nx: function(s, p, n) { return n === 1 ? s : p; },
          isRTL: function() { return false; },
          sprintf: function(f) {
            var args = Array.prototype.slice.call(arguments, 1), i = 0;
            return f.replace(/%[sfd]/g, function() { return args[i++] !== undefined ? args[i - 1] : ''; });
          },
          hasTranslation: function() { return false; }
        };
      })();
    `);
  }

  const foundFile = findStaticFile(req.originalUrl, req.path);
  if (foundFile) {
    // Determine content type
    let contentType = mime.lookup(foundFile);
    if (!contentType) {
      if (foundFile.includes('.css')) contentType = 'text/css';
      else if (foundFile.includes('.js')) contentType = 'application/javascript';
      else if (foundFile.includes('.svg')) contentType = 'image/svg+xml';
      else if (foundFile.includes('.woff2')) contentType = 'font/woff2';
      else if (foundFile.includes('.woff')) contentType = 'font/woff';
      else if (foundFile.includes('.ttf')) contentType = 'font/ttf';
      else if (foundFile.includes('.png')) contentType = 'image/png';
      else if (foundFile.includes('.jpg') || foundFile.includes('.jpeg')) contentType = 'image/jpeg';
      else if (foundFile.includes('.webp')) contentType = 'image/webp';
    }

    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    // Static assets cache policy: keep static-interactive.js fresh, cache static media/fonts
    if (foundFile.includes('static-interactive.js')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
    }
    return res.sendFile(foundFile);
  }

  next();
});

// Fallback for missing assets to avoid returning index.html (which causes SyntaxError: Unexpected token '<')
app.use((req, res, next) => {
  const reqUrl = req.originalUrl || req.url || '';
  const cleanPath = req.path || '';

  // Handle missing JS or webpack bundles
  if (cleanPath.endsWith('.js') || reqUrl.includes('.js')) {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
    
    // Webpack chunk fallback response registering all chunk IDs
    return res.send(`
      /* Webpack bundle fallback */
      try {
        if (typeof self !== 'undefined') {
          var eChunks = [786, 216, 30, 131, 707, 457, 234, 575, 775, 180, 177, 212, 211, 215, 915, 1, 336, 557, 396, 768, 77, 220, 304];
          var proChunks = [714, 721, 256, 699, 156, 241, 26, 534, 369, 804, 888, 680, 121, 288, 42, 50, 985, 287, 824, 58, 114, 443, 838, 685, 858, 102, 1, 124, 859, 979, 497, 800, 149, 153, 356, 495, 157, 244, 209, 188, 725, 8, 322, 464];
          self.webpackChunkelementor = self.webpackChunkelementor || [];
          self.webpackChunkelementor.push([eChunks, {}]);
          self.webpackChunkelementorPro = self.webpackChunkelementorPro || [];
          self.webpackChunkelementorPro.push([proChunks, {}]);
        }
      } catch(e) {}
    `);
  }

  // Handle missing CSS
  if (cleanPath.endsWith('.css') || reqUrl.includes('.css')) {
    res.setHeader('Content-Type', 'text/css');
    res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
    return res.send('/* CSS fallback */');
  }

  // Handle missing images/fonts
  if (
    cleanPath.match(/\.(png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|eot|mp4|webm|json)$/i) ||
    reqUrl.match(/\.(png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|eot|mp4|webm|json)(\?.*)?$/i)
  ) {
    return res.status(404).send('Asset not found');
  }

  next();
});

// Fallback for HTML navigation
app.use((req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400');
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});

export default app;
