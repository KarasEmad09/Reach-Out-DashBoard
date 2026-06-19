const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./db');
const { seed } = require('./seed');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'saleshub-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize database
initDb();

// Serve static files from root
app.use(express.static(path.join(__dirname, '..')));

// API routes
app.use('/api/auth', require('./api/auth'));
app.use('/api/customers', require('./api/customers'));
app.use('/api/deals', require('./api/deals'));
app.use('/api/tasks', require('./api/tasks'));
app.use('/api/notes', require('./api/notes'));
app.use('/api/notifications', require('./api/notifications'));
app.use('/api/settings', require('./api/settings'));
app.use('/api/activity', require('./api/activity'));
app.use('/api/users', require('./api/users'));

// SPA fallback: serve index.html for non-API routes
app.get('/{*path}', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
  }
});

// Seed and start
async function start() {
  await seed();
  app.listen(PORT, () => {
    console.log(`SalesHub CRM server running on http://localhost:${PORT}`);
  });
}

start().catch(console.error);
