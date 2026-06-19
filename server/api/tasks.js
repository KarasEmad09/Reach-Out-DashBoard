const express = require('express');
const { getDb } = require('../db');
const { requireAuth, requireRole, applyScope, logActivity } = require('./middleware');

const router = express.Router();

router.use(requireAuth);
router.use(applyScope);

// GET /api/tasks
router.get('/', (req, res) => {
  const db = getDb();
  let where = '1=1';
  const params = [];

  if (req.user.role === 'agent') {
    where = '(t.assigned_to = ?)';
    params.push(req.user.id);
  }
  // Admins and super admins see all tasks

  if (req.query.status) { where += ' AND t.status = ?'; params.push(req.query.status); }
  if (req.query.priority) { where += ' AND t.priority = ?'; params.push(req.query.priority); }
  if (req.query.search) { where += ' AND t.title LIKE ?'; params.push(`%${req.query.search}%`); }

  const tasks = db.prepare(`
    SELECT t.*, c.name as customer_name, u.name as assignee_name_fk
    FROM tasks t
    LEFT JOIN customers c ON t.customer_id = c.id
    LEFT JOIN users u ON t.assigned_to = u.id
    WHERE ${where}
    ORDER BY t.due_date ASC
  `).all(...params);

  // Override assignee_name with FK name if available
  const result = tasks.map(t => ({
    ...t,
    assignee_name: t.assignee_name_fk || t.assignee_name
  }));

  res.json(result);
});

// GET /api/tasks/:id
router.get('/:id', (req, res) => {
  const db = getDb();
  const task = db.prepare(`
    SELECT t.*, c.name as customer_name
    FROM tasks t
    LEFT JOIN customers c ON t.customer_id = c.id
    WHERE t.id = ?
  `).get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

// POST /api/tasks
router.post('/', requireRole('admin', 'super_admin'), (req, res) => {
  const db = getDb();
  const { title, description, due_date, status, priority, customer_id, assigned_to, assignee_name } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const r = db.prepare(`
    INSERT INTO tasks (title, description, due_date, status, priority, customer_id, assigned_to, assignee_name, created_by)
    VALUES (?,?,?,?,?,?,?,?,?)
  `).run(title, description || null, due_date || null, status || 'todo', priority || 'medium',
         customer_id || null, assigned_to || null, assignee_name || null, req.user.id);

  if (assigned_to) {
    db.prepare('INSERT INTO notifications (user_id, message) VALUES (?,?)')
      .run(assigned_to, 'New task assigned: ' + title);
  }

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(r.lastInsertRowid);
  logActivity(req.user.id, 'create', 'tasks', task.id, { title });
  res.status(201).json(task);
});

// PUT /api/tasks/:id
router.put('/:id', requireRole('admin', 'super_admin'), (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Task not found' });

  const { title, description, due_date, status, priority, customer_id, assigned_to, assignee_name } = req.body;

  db.prepare(`
    UPDATE tasks SET title=?, description=?, due_date=?, status=?, priority=?, customer_id=?, assigned_to=?, assignee_name=?, updated_at=datetime('now')
    WHERE id=?
  `).run(
    title !== undefined ? title : existing.title,
    description !== undefined ? description : existing.description,
    due_date !== undefined ? due_date : existing.due_date,
    status !== undefined ? status : existing.status,
    priority !== undefined ? priority : existing.priority,
    customer_id !== undefined ? customer_id : existing.customer_id,
    assigned_to !== undefined ? assigned_to : existing.assigned_to,
    assignee_name !== undefined ? assignee_name : existing.assignee_name,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  logActivity(req.user.id, 'update', 'tasks', req.params.id, { before: existing.status, after: status });
  res.json(updated);
});

// DELETE /api/tasks/:id
router.delete('/:id', requireRole('admin', 'super_admin'), (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Task not found' });

  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  logActivity(req.user.id, 'delete', 'tasks', req.params.id, { title: existing.title });
  res.json({ ok: true });
});

module.exports = router;
