import express from 'express';
import path from 'path';
import fs from 'fs';
import https from 'https';
import { fileURLToPath } from 'url';
import mime from 'mime-types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// API route for contact form submissions
app.post('/api/contact', (req, res) => {
  const { form_fields } = req.body || {};
  console.log('Contact form submission received:', req.body);
  res.status(200).json({
    success: true,
    message: 'Thank you! Your message has been received.'
  });
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
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
