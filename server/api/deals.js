const express = require('express');
const { getDb } = require('../db');
const { requireAuth, requireRole, applyScope, logActivity } = require('./middleware');

const router = express.Router();

router.use(requireAuth);
router.use(applyScope);

// GET /api/deals
router.get('/', (req, res) => {
  const db = getDb();
  let where = '1=1';
  const params = [];

  if (req.user.role === 'agent') {
    where = '(d.assigned_agent_id = ?)';
    params.push(req.user.id);
  }
  // Admins and super admins see all deals

  if (req.query.stage) { where += ' AND d.stage = ?'; params.push(req.query.stage); }

  const deals = db.prepare(`
    SELECT d.*, c.name as customer_name, c.status as customer_status, u.name as agent_name
    FROM deals d
    JOIN customers c ON d.customer_id = c.id
    LEFT JOIN users u ON d.assigned_agent_id = u.id
    WHERE ${where}
    ORDER BY d.updated_at DESC
  `).all(...params);

  res.json(deals);
});

// POST /api/deals
router.post('/', requireRole('admin', 'super_admin'), (req, res) => {
  const db = getDb();
  const { customer_id, title, value, stage, product_purchased, lost_reason, assigned_agent_id } = req.body;
  if (!customer_id) return res.status(400).json({ error: 'customer_id is required' });

  const r = db.prepare(`
    INSERT INTO deals (customer_id, title, value, stage, assigned_agent_id, product_purchased, lost_reason)
    VALUES (?,?,?,?,?,?,?)
  `).run(customer_id, title || '', value || 0, stage || 'New Lead', assigned_agent_id || null, product_purchased || null, lost_reason || null);

  if (stage === 'Won Deal' || stage === 'Lost Deal') {
    db.prepare("UPDATE deals SET closed_at = datetime('now') WHERE id = ?").run(r.lastInsertRowid);
    db.prepare("UPDATE customers SET status = ? WHERE id = ?").run(stage, customer_id);
  }

  const deal = db.prepare('SELECT * FROM deals WHERE id = ?').get(r.lastInsertRowid);
  logActivity(req.user.id, 'create', 'deals', deal.id, { title, value });
  res.status(201).json(deal);
});

// PUT /api/deals/:id
router.put('/:id', requireRole('admin', 'super_admin'), (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM deals WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Deal not found' });

  const { customer_id, title, value, stage, product_purchased, lost_reason, assigned_agent_id } = req.body;
  const newStage = stage || existing.stage;

  db.prepare(`
    UPDATE deals SET customer_id=?, title=?, value=?, stage=?, assigned_agent_id=?, product_purchased=?, lost_reason=?, updated_at=datetime('now')
    WHERE id=?
  `).run(
    customer_id || existing.customer_id,
    title !== undefined ? title : existing.title,
    value !== undefined ? value : existing.value,
    newStage,
    assigned_agent_id !== undefined ? assigned_agent_id : existing.assigned_agent_id,
    product_purchased !== undefined ? product_purchased : existing.product_purchased,
    lost_reason !== undefined ? lost_reason : existing.lost_reason,
    req.params.id
  );

  if ((newStage === 'Won Deal' || newStage === 'Lost Deal') && !existing.closed_at) {
    db.prepare("UPDATE deals SET closed_at = datetime('now') WHERE id = ?").run(req.params.id);
    if (customer_id || existing.customer_id) {
      db.prepare('UPDATE customers SET status = ? WHERE id = ?').run(newStage, customer_id || existing.customer_id);
    }
  }

  const updated = db.prepare('SELECT * FROM deals WHERE id = ?').get(req.params.id);
  logActivity(req.user.id, 'update', 'deals', req.params.id, { before: existing.stage, after: newStage });
  res.json(updated);
});

// DELETE /api/deals/:id
router.delete('/:id', requireRole('admin', 'super_admin'), (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM deals WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Deal not found' });

  db.prepare('DELETE FROM deals WHERE id = ?').run(req.params.id);
  logActivity(req.user.id, 'delete', 'deals', req.params.id, { title: existing.title });
  res.json({ ok: true });
});

module.exports = router;
