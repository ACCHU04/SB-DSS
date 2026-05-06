// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initTables } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

const defaultOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'https://sb-dss.web.app',
  'https://sb-dss.firebaseapp.com'
];

const envOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

const corsOptions = {
  origin(origin, callback) {
    // Allow non-browser requests without Origin and local tooling.
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS not allowed for this origin'));
  }
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/public')));

app.use('/api/products', require('./routes/products'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/decisions', require('./routes/decisions'));
app.use('/api', require('./routes/extras'));

app.get('/api/health', (req, res) => res.json({ status: 'OK', system: 'SB-DSS', version: '1.0.0' }));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../frontend/public/index.html')));

initTables().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 SB-DSS running at http://localhost:${PORT}\n`);
  });
}).catch(err => { console.error('DB init failed:', err); process.exit(1); });
