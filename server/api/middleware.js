const { getDb } = require('../db');

function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const db = getDb();
  const user = db.prepare('SELECT id, name, email, role, manager_id, avatar, is_active FROM users WHERE id = ?').get(req.session.userId);
  if (!user || !user.is_active) {
    req.session.destroy();
    return res.status(401).json({ error: 'Account not found or deactivated' });
  }
  req.user = user;
  next();
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

function applyScope(req, res, next) {
  if (req.user.role === 'agent') {
    req.scope = { col: 'assigned_agent_id', id: req.user.id };
    req.scopeOrCreated = { col: 'assigned_agent_id', id: req.user.id, colOr: 'created_by', idOr: req.user.id };
  } else if (req.user.role === 'admin') {
    const db = getDb();
    const teamIds = db.prepare('SELECT id FROM users WHERE manager_id = ?').all(req.user.id).map(u => u.id);
    teamIds.push(req.user.id);
    req.scopeTeam = teamIds;
  }
  // super_admin: no scope filter
  next();
}

function logActivity(userId, action, targetTable, targetId, details) {
  const db = getDb();
  db.prepare(
    'INSERT INTO activity_log (user_id, action, target_table, target_id, details) VALUES (?,?,?,?,?)'
  ).run(userId, action, targetTable, targetId || null, details ? JSON.stringify(details) : null);
}

module.exports = { requireAuth, requireRole, applyScope, logActivity };
