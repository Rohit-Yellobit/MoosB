import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mime from 'mime-types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API route for contact form submissions
app.post('/api/contact', (req, res) => {
  const { form_fields } = req.body || {};
  console.log('Contact form submission received:', req.body);
  res.status(200).json({
    success: true,
    message: 'Thank you! Your message has been received.'
  });
});

// Helper to find actual file on disk considering query params embedded in filenames
function findStaticFile(requestedUrl, requestedPath) {
  const decodedPath = decodeURIComponent(requestedPath).replace(/^\/+/, '');
  const decodedUrl = decodeURIComponent(requestedUrl.split('#')[0]).replace(/^\/+/, '');
  const rawUrl = requestedUrl.split('#')[0].replace(/^\/+/, '');

  const candidates = [
    decodedUrl,
    rawUrl,
    decodedPath,
    decodedPath.split('?')[0],
    decodedPath.split('%3F')[0],
    decodedUrl.split('?')[0],
    rawUrl.split('?')[0],
    decodedPath.replace('/elementor/thumbs/', '/'),
    path.join('wp-content/uploads/2024/09', path.basename(decodedPath.split('?')[0].split('%3F')[0]))
  ];

  if (decodedPath.includes('rubix-qu78yis')) {
    candidates.push('wp-content/uploads/elementor/thumbs/rubix-qu78yisq23av74jrtvjrjiew8ioiuo5xy05xxjlre0.png');
    candidates.push('wp-content/uploads/2024/09/rubix-150x150.png');
  }
  if (decodedPath.includes('100-qu78lhr')) {
    candidates.push('wp-content/uploads/elementor/thumbs/100-qu78lhra22qvf5b1aism5sewl6t0v45sdzkvyhtj9s.png');
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
      // exact match or stripped query match
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

  // Exact root
  if (cleanPath === '/' || cleanPath === '') {
    return res.sendFile(path.join(__dirname, 'index.html'));
  }

  // Exact subfolder index
  if (cleanPath === '/best-mentalist-magician-from-kerala' || cleanPath === '/best-mentalist-magician-from-kerala/') {
    return res.sendFile(path.join(__dirname, 'best-mentalist-magician-from-kerala', 'index.html'));
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
