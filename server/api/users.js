const express = require('express');
const { getDb } = require('../db');
const { requireAuth, requireRole, logActivity } = require('./middleware');

const router = express.Router();
router.use(requireAuth);

// GET /api/users — scoped by role
router.get('/', requireRole('admin', 'super_admin'), (req, res) => {
  const db = getDb();
  let users;

  if (req.user.role === 'super_admin') {
    // Super admin sees all agents and admins (not themselves or other supers)
    users = db.prepare(
      "SELECT id, name, email, role, manager_id, avatar, is_active, created_at FROM users WHERE role IN ('agent','admin') ORDER BY role, name"
    ).all();
  } else {
    // Admin sees only their agents
    users = db.prepare(
      "SELECT id, name, email, role, manager_id, avatar, is_active, created_at FROM users WHERE manager_id = ? ORDER BY name"
    ).all(req.user.id);
  }

  // Attach manager name for agents
  const enriched = users.map(u => {
    let managerName = null;
    if (u.manager_id) {
      const mgr = db.prepare('SELECT name FROM users WHERE id = ?').get(u.manager_id);
      if (mgr) managerName = mgr.name;
    }
    return { ...u, manager_name: managerName };
  });

  res.json(enriched);
});

module.exports = router;
