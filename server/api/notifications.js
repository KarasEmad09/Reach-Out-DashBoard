const express = require('express');
const { getDb } = require('../db');
const { requireAuth } = require('./middleware');

const router = express.Router();
router.use(requireAuth);

// GET /api/notifications
router.get('/', (req, res) => {
  const db = getDb();
  const notifs = db.prepare(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.user.id);
  res.json(notifs);
});

// PUT /api/notifications/:id/read
router.put('/:id/read', (req, res) => {
  const db = getDb();
  const n = db.prepare('SELECT * FROM notifications WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!n) return res.status(404).json({ error: 'Not found' });
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// PUT /api/notifications/read-all
router.put('/read-all', (req, res) => {
  const db = getDb();
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
  res.json({ ok: true });
});

// DELETE /api/notifications/:id
router.delete('/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM notifications WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

module.exports = router;
