// src/app.js - Express app (MVC assembly)
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const routes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');

const app = express();

// Behind Nginx / a hosting proxy set TRUST_PROXY=1 so req.ip is the visitor's real IP
// (from X-Forwarded-For) instead of the proxy's. Leave unset when clients connect directly,
// otherwise anyone could fake their IP with that header.
if (process.env.TRUST_PROXY) {
  const hops = Number(process.env.TRUST_PROXY);
  app.set('trust proxy', Number.isNaN(hops) ? process.env.TRUST_PROXY : hops);
}

app.use(helmet({
  crossOriginResourcePolicy: false,
  // Razorpay Checkout opens popups (UPI apps / bank 3-D Secure pages)
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  // Rules for the built website/admin (backend/dist) served below
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://checkout.razorpay.com'],
      styleSrc: ["'self'", "'unsafe-inline'"], // React inline style={{...}} animation delays
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      fontSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'ws:', 'wss:', 'https://api.razorpay.com', 'https://lumberjack.razorpay.com'],
      frameSrc: ['https://api.razorpay.com', 'https://checkout.razorpay.com'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'self'"],
      // Helmet adds this by default; it would force https:// and break http://<network-ip>:5000
      upgradeInsecureRequests: null,
    },
  },
}));
app.use(compression());
app.use(cors({
  origin: [process.env.CLIENT_ADMIN_URL, process.env.CLIENT_WEBSITE_URL],
  credentials: true,
}));
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (req, res) => res.json({ success: true, message: 'API is running' }));
app.use('/api', routes);

// Built frontend (npm run build:frontend -> backend/dist) - website + admin panel on this same port.
// Unknown /api and /uploads paths still get the JSON 404 below.
const FRONTEND_DIST = path.join(__dirname, '..', 'dist');
if (fs.existsSync(path.join(FRONTEND_DIST, 'index.html'))) {
  app.use(express.static(FRONTEND_DIST, {
    index: false,
    // Vite file names contain a content hash, so they can be cached for a long time
    setHeaders: (res, file) => {
      if (file.includes(`${path.sep}assets${path.sep}`)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    },
  }));
  // Client-side routes (/products/5, /admin/dashboard, ...) all load index.html
  app.get(/^\/(?!api\/|api$|uploads\/).*/, (req, res) => {
    res.setHeader('Cache-Control', 'no-cache'); // always pick up a new build
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  });
  console.log(`[Server] Serving built frontend from ${FRONTEND_DIST}`);
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;
