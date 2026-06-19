const express = require('express');
const { getDb } = require('../db');
const { requireAuth, requireRole, applyScope, logActivity } = require('./middleware');

const router = express.Router();

router.use(requireAuth);
router.use(applyScope);

function buildScopeWhere(req) {
  if (req.user.role === 'agent') {
    return { clause: '(c.assigned_agent_id = ? OR c.created_by = ?)', params: [req.user.id, req.user.id] };
  }
  // Admins and super admins see all customers
  return { clause: '1=1', params: [] };
}

// GET /api/customers
router.get('/', (req, res) => {
  const db = getDb();
  const { clause, params } = buildScopeWhere(req);
  const { status, search } = req.query;

  let where = clause;
  if (status) { where += ' AND c.status = ?'; params.push(status); }
  if (search) { where += ' AND c.name LIKE ?'; params.push(`%${search}%`); }

  const customers = db.prepare(`
    SELECT c.*, u.name as agent_name,
      (SELECT d.value FROM deals d WHERE d.customer_id = c.id ORDER BY d.updated_at DESC LIMIT 1) as deal_value,
      (SELECT d.product_purchased FROM deals d WHERE d.customer_id = c.id ORDER BY d.updated_at DESC LIMIT 1) as product_purchased,
      (SELECT d.lost_reason FROM deals d WHERE d.customer_id = c.id AND d.stage = 'Lost Deal' ORDER BY d.updated_at DESC LIMIT 1) as lost_reason
    FROM customers c
    LEFT JOIN users u ON c.assigned_agent_id = u.id
    WHERE ${where}
    ORDER BY c.updated_at DESC
  `).all(...params);

  res.json(customers);
});

// GET /api/customers/:id
router.get('/:id', (req, res) => {
  const db = getDb();
  const { clause, params } = buildScopeWhere(req);
  params.push(req.params.id);

  const customer = db.prepare(`
    SELECT c.*, u.name as agent_name,
      (SELECT d.value FROM deals d WHERE d.customer_id = c.id ORDER BY d.updated_at DESC LIMIT 1) as deal_value,
      (SELECT d.product_purchased FROM deals d WHERE d.customer_id = c.id ORDER BY d.updated_at DESC LIMIT 1) as product_purchased,
      (SELECT d.lost_reason FROM deals d WHERE d.customer_id = c.id AND d.stage = 'Lost Deal' ORDER BY d.updated_at DESC LIMIT 1) as lost_reason
    FROM customers c
    LEFT JOIN users u ON c.assigned_agent_id = u.id
    WHERE ${clause} AND c.id = ?
  `).get(...params);

  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const notes = db.prepare('SELECT n.*, u.name as author_name FROM notes n LEFT JOIN users u ON n.author_id = u.id WHERE n.customer_id = ? ORDER BY n.created_at DESC').all(customer.id);
  const deals = db.prepare('SELECT * FROM deals WHERE customer_id = ? ORDER BY updated_at DESC').all(customer.id);
  const tasks = db.prepare('SELECT * FROM tasks WHERE customer_id = ? ORDER BY updated_at DESC').all(customer.id);

  res.json({ ...customer, notes, deals, tasks });
});

// POST /api/customers
router.post('/', requireRole('admin', 'super_admin'), (req, res) => {
  const db = getDb();
  const { name, email, phone, company, source, status, lastContactDate, nextFollowUpDate, dealValue, lostReason } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const lifecycle = statusMap[status] || 'lead';

  const r = db.prepare(`
    INSERT INTO customers (name, email, phone, company, source, status, lifecycle, assigned_agent_id, created_by, last_contact_date, next_follow_up_date)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
  `).run(name, email || null, phone || null, company || null, source || null, status || 'New Lead', lifecycle,
         req.body.assigned_agent_id || null, req.user.id,
         lastContactDate || null, nextFollowUpDate || null);

  const customerId = r.lastInsertRowid;

  // Create/update deal if status is Won Deal and dealValue provided
  if (status === 'Won Deal' && dealValue) {
    const existingDeal = db.prepare('SELECT id FROM deals WHERE customer_id = ?').get(customerId);
    if (existingDeal) {
      db.prepare("UPDATE deals SET value = ?, stage = 'Won Deal', updated_at = datetime('now'), closed_at = datetime('now') WHERE id = ?")
        .run(dealValue, existingDeal.id);
    } else {
      db.prepare("INSERT INTO deals (customer_id, title, value, stage, assigned_agent_id, closed_at) VALUES (?,?,?,'Won Deal',?,datetime('now'))")
        .run(customerId, 'Deal for ' + name, dealValue, req.body.assigned_agent_id || null);
    }
  }

  // Create lost deal record if status is Lost Deal
  if (status === 'Lost Deal') {
    db.prepare("INSERT INTO deals (customer_id, title, value, stage, assigned_agent_id, lost_reason, closed_at) VALUES (?,?,0,'Lost Deal',?,?,datetime('now'))")
      .run(customerId, 'Deal for ' + name, req.body.assigned_agent_id || null, lostReason || null);
  }

  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
  logActivity(req.user.id, 'create', 'customers', customer.id, { name });

  // Create notification for the assigned agent
  if (req.body.assigned_agent_id) {
    db.prepare('INSERT INTO notifications (user_id, message) VALUES (?,?)').run(req.body.assigned_agent_id, 'New customer ' + name + ' added');
  }

  res.status(201).json(customer);
});

// PUT /api/customers/:id
router.put('/:id', requireRole('admin', 'super_admin'), (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Customer not found' });

  // Super admins and admins can edit any customer
  if (req.user.role === 'agent') {
    if (existing.assigned_agent_id !== req.user.id && existing.created_by !== req.user.id) {
      return res.status(404).json({ error: 'Customer not found' });
    }
  }

  const { name, email, phone, company, source, status, lastContactDate, nextFollowUpDate, assigned_agent_id, dealValue, lostReason } = req.body;
  const newStatus = status || existing.status;
  const lifecycle = statusMap[newStatus] || existing.lifecycle;

  db.prepare(`
    UPDATE customers SET name=?, email=?, phone=?, company=?, source=?, status=?, lifecycle=?,
    assigned_agent_id=?, last_contact_date=?, next_follow_up_date=?, updated_at=datetime('now')
    WHERE id=?
  `).run(
    name || existing.name,
    email !== undefined ? email : existing.email,
    phone !== undefined ? phone : existing.phone,
    company !== undefined ? company : existing.company,
    source !== undefined ? source : existing.source,
    newStatus,
    lifecycle,
    assigned_agent_id !== undefined ? assigned_agent_id : existing.assigned_agent_id,
    lastContactDate !== undefined ? lastContactDate : existing.last_contact_date,
    nextFollowUpDate !== undefined ? nextFollowUpDate : existing.next_follow_up_date,
    req.params.id
  );

  // Handle deal when status changes to Won Deal
  if (newStatus === 'Won Deal' && dealValue) {
    const existingDeal = db.prepare('SELECT id FROM deals WHERE customer_id = ?').get(req.params.id);
    if (existingDeal) {
      db.prepare("UPDATE deals SET value = ?, stage = 'Won Deal', updated_at = datetime('now'), closed_at = CASE WHEN closed_at IS NULL THEN datetime('now') ELSE closed_at END WHERE id = ?")
        .run(dealValue, existingDeal.id);
    } else {
      db.prepare("INSERT INTO deals (customer_id, title, value, stage, assigned_agent_id, closed_at) VALUES (?,?,?,'Won Deal',?,datetime('now'))")
        .run(req.params.id, 'Deal for ' + (name || existing.name), dealValue, assigned_agent_id || existing.assigned_agent_id || null);
    }
  }

  // Handle lost deal when status changes to Lost Deal
  if (newStatus === 'Lost Deal') {
    const existingDeal = db.prepare('SELECT id FROM deals WHERE customer_id = ?').get(req.params.id);
    if (existingDeal) {
      db.prepare("UPDATE deals SET stage = 'Lost Deal', lost_reason = ?, updated_at = datetime('now'), closed_at = CASE WHEN closed_at IS NULL THEN datetime('now') ELSE closed_at END WHERE id = ?")
        .run(lostReason || null, existingDeal.id);
    } else {
      db.prepare("INSERT INTO deals (customer_id, title, value, stage, assigned_agent_id, lost_reason, closed_at) VALUES (?,?,0,'Lost Deal',?,?,datetime('now'))")
        .run(req.params.id, 'Deal for ' + (name || existing.name), assigned_agent_id || existing.assigned_agent_id || null, lostReason || null);
    }
  }

  if (newStatus !== existing.status) {
    db.prepare('INSERT INTO notifications (user_id, message) VALUES (?,?)')
      .run(req.user.id, existing.name + ' moved from ' + existing.status + ' to ' + newStatus);
  }

  const updated = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  logActivity(req.user.id, 'update', 'customers', req.params.id, { before: existing.status, after: newStatus });
  res.json(updated);
});

// DELETE /api/customers/:id
router.delete('/:id', requireRole('admin', 'super_admin'), (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Customer not found' });

  // Super admins and admins can delete any customer; agents cannot reach this route

  db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
  logActivity(req.user.id, 'delete', 'customers', req.params.id, { name: existing.name });
  res.json({ ok: true });
});

const statusMap = {
  'New Lead': 'lead',
  'Interested Customer': 'prospect',
  'Hot Lead': 'prospect',
  'Follow Up': 'active_customer',
  'Won Deal': 'active_customer',
  'Lost Deal': 'inactive'
};

module.exports = router;
