const express = require('express');
const { getDb } = require('../db');
const { requireAuth } = require('./middleware');

const router = express.Router();
router.use(requireAuth);

// GET /api/settings
router.get('/', (req, res) => {
  const db = getDb();
  const settings = db.prepare('SELECT key, value FROM settings WHERE user_id = ? OR user_id IS NULL').all(req.user.id);
  const obj = {};
  for (const s of settings) obj[s.key] = s.value;
  res.json(obj);
});

// PUT /api/settings/:key
router.put('/:key', (req, res) => {
  const db = getDb();
  db.prepare(`
    INSERT INTO settings (user_id, key, value) VALUES (?,?,?)
    ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value
  `).run(req.user.id, req.params.key, String(req.body.value));
  res.json({ ok: true });
});

module.exports = router;
