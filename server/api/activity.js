const express = require('express');
const { getDb } = require('../db');
const { requireAuth, requireRole, applyScope } = require('./middleware');

const router = express.Router();
router.use(requireAuth);
router.use(applyScope);

// GET /api/activity
router.get('/', requireRole('admin', 'super_admin'), (req, res) => {
  const db = getDb();
  let where = '1=1';
  const params = [];

  if (req.user.role === 'admin') {
    const teamIds = db.prepare('SELECT id FROM users WHERE manager_id = ?').all(req.user.id).map(u => u.id);
    teamIds.push(req.user.id);
    const ph = teamIds.map(() => '?').join(',');
    where = `a.user_id IN (${ph})`;
    params.push(...teamIds);
  }

  const limit = parseInt(req.query.limit) || 50;
  params.push(limit);

  const activity = db.prepare(`
    SELECT a.*, u.name as user_name, u.role as user_role
    FROM activity_log a
    LEFT JOIN users u ON a.user_id = u.id
    WHERE ${where}
    ORDER BY a.created_at DESC
    LIMIT ?
  `).all(...params);

  res.json(activity);
});

module.exports = router;
