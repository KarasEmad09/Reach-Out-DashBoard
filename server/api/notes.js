const express = require('express');
const { getDb } = require('../db');
const { requireAuth, requireRole, applyScope, logActivity } = require('./middleware');

const router = express.Router();

router.use(requireAuth);
router.use(applyScope);

// GET /api/notes
router.get('/', (req, res) => {
  const db = getDb();
  let where = '1=1';
  const params = [];

  if (req.user.role === 'agent') {
    where = `(c.assigned_agent_id = ? OR c.created_by = ?)`;
    params.push(req.user.id, req.user.id);
  }
  // Admins and super admins see all notes — no filter

  if (req.query.type) { where += ' AND n.type = ?'; params.push(req.query.type); }
  if (req.query.customer_id) { where += ' AND n.customer_id = ?'; params.push(req.query.customer_id); }

  const notes = db.prepare(`
    SELECT n.*, u.name as author_name, c.name as customer_name
    FROM notes n
    JOIN customers c ON n.customer_id = c.id
    LEFT JOIN users u ON n.author_id = u.id
    WHERE ${where}
    ORDER BY n.created_at DESC
  `).all(...params);

  res.json(notes);
});

// POST /api/notes
router.post('/', requireRole('admin', 'super_admin'), (req, res) => {
  const db = getDb();
  const { customer_id, deal_id, type, content } = req.body;
  if (!customer_id) return res.status(400).json({ error: 'customer_id is required' });
  if (!content) return res.status(400).json({ error: 'content is required' });

  // Admins and super admins can add notes to any customer

  const r = db.prepare(
    'INSERT INTO notes (customer_id, deal_id, author_id, type, content) VALUES (?,?,?,?,?)'
  ).run(customer_id, deal_id || null, req.user.id, type || 'note', content);

  const note = db.prepare(`
    SELECT n.*, u.name as author_name, c.name as customer_name
    FROM notes n
    JOIN customers c ON n.customer_id = c.id
    LEFT JOIN users u ON n.author_id = u.id
    WHERE n.id = ?
  `).get(r.lastInsertRowid);

  logActivity(req.user.id, 'create', 'notes', note.id, { customer_id, type });

  const custName = db.prepare('SELECT name FROM customers WHERE id = ?').get(customer_id);
  const notifMsg = (type === 'question' ? 'A question was added to ' : 'A note was added to ') + (custName ? custName.name : 'customer');
  if (req.body.assigned_agent_id) {
    db.prepare('INSERT INTO notifications (user_id, message) VALUES (?,?)').run(req.body.assigned_agent_id, notifMsg);
  }
  db.prepare('INSERT INTO notifications (user_id, message) VALUES (?,?)').run(req.user.id, notifMsg);

  res.status(201).json(note);
});

// DELETE /api/notes/:id
router.delete('/:id', requireRole('admin', 'super_admin'), (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Note not found' });

  db.prepare('DELETE FROM notes WHERE id = ?').run(req.params.id);
  logActivity(req.user.id, 'delete', 'notes', req.params.id, null);
  res.json({ ok: true });
});

module.exports = router;
