const express = require('express');
const bcrypt = require('bcrypt');
const { getDb } = require('../db');
const { requireAuth, logActivity } = require('./middleware');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (!user.is_active) {
    return res.status(403).json({ error: 'Account deactivated' });
  }

  req.session.userId = user.id;
  logActivity(user.id, 'login', 'users', user.id, { email: user.email });

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar || user.name[0],
      manager_id: user.manager_id
    }
  });
});

router.post('/logout', (req, res) => {
  if (req.session.userId) {
    logActivity(req.session.userId, 'logout', 'users', req.session.userId, null);
  }
  req.session.destroy();
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
