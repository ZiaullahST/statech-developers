require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path = require('path');
const { readJson, writeJson } = require('./db');
const { requireAuth, requireAdmin } = require('./auth');
const {
  findUserByEmail,
  findUserById,
  verifyPassword,
  createUser,
  updateUserPassword,
  deleteUser,
  sanitizeUser,
  listUsers,
  initializeDefaultAdmin
} = require('./users');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const ROOT = path.join(__dirname, '..');
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  app.set('trust proxy', 1);
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'statech-dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    }
  })
);

// Health check (for hosting platforms)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// --- Auth routes ---

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = findUserByEmail(email);
  if (!user || !(await verifyPassword(user, password))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  req.session.userId = user.id;
  req.session.role = user.role;
  req.session.userName = user.name;

  res.json({ user: sanitizeUser(user) });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

app.get('/api/auth/me', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const user = findUserById(req.session.userId);
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }
  res.json({ user: sanitizeUser(user) });
});

// --- Public content API ---

app.get('/api/content', (req, res) => {
  const content = readJson('content.json');
  if (!content) {
    return res.status(500).json({ error: 'Content not found' });
  }
  res.json(content);
});

app.put('/api/content', requireAuth, (req, res) => {
  const content = req.body;
  if (!content || typeof content !== 'object') {
    return res.status(400).json({ error: 'Invalid content' });
  }
  writeJson('content.json', content);
  res.json({ success: true, content });
});

// --- Contact form (public) ---

app.post('/api/contact', (req, res) => {
  const { firstName, lastName, email, phone, subject, message } = req.body;

  if (!firstName || !lastName || !email || !subject || !message) {
    return res.status(400).json({ error: 'Required fields missing' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  const messages = readJson('messages.json', []);
  const entry = {
    id: 'msg' + Date.now(),
    firstName,
    lastName,
    email,
    phone: phone || '',
    subject,
    message,
    read: false,
    createdAt: new Date().toISOString()
  };
  messages.unshift(entry);
  writeJson('messages.json', messages);

  res.json({ success: true, message: 'Thank you for your message! We will get back to you soon.' });
});

// --- Messages (protected) ---

app.get('/api/messages', requireAuth, (req, res) => {
  const messages = readJson('messages.json', []);
  res.json(messages);
});

app.patch('/api/messages/:id', requireAuth, (req, res) => {
  const messages = readJson('messages.json', []);
  const index = messages.findIndex((m) => m.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Message not found' });

  if (req.body.read !== undefined) messages[index].read = req.body.read;
  writeJson('messages.json', messages);
  res.json(messages[index]);
});

app.delete('/api/messages/:id', requireAuth, (req, res) => {
  let messages = readJson('messages.json', []);
  const before = messages.length;
  messages = messages.filter((m) => m.id !== req.params.id);
  if (messages.length === before) return res.status(404).json({ error: 'Message not found' });
  writeJson('messages.json', messages);
  res.json({ success: true });
});

app.delete('/api/messages', requireAuth, (req, res) => {
  writeJson('messages.json', []);
  res.json({ success: true });
});

// --- Team user management (admin only) ---

app.get('/api/users', requireAuth, requireAdmin, (req, res) => {
  res.json(listUsers());
});

app.post('/api/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const user = await createUser({ email, password, name, role: role || 'editor' });
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/users/:id', requireAuth, requireAdmin, (req, res) => {
  if (req.params.id === req.session.userId) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }
  try {
    deleteUser(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

app.put('/api/users/password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password are required' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const user = findUserById(req.session.userId);
  if (!user || !(await verifyPassword(user, currentPassword))) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  await updateUserPassword(user.id, newPassword);
  res.json({ success: true });
});

// --- Protected page routes ---

app.get('/admin', requireAuth, (req, res) => {
  res.sendFile(path.join(ROOT, 'admin.html'));
});

app.get('/login', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/admin');
  }
  res.sendFile(path.join(ROOT, 'login.html'));
});

// --- Static files ---

app.use(express.static(ROOT, {
  index: 'index.html',
  dotfiles: 'ignore'
}));

// Block direct access to admin.html without auth
app.get('/admin.html', (req, res) => {
  res.redirect('/admin');
});

// --- Start ---

initializeDefaultAdmin().then(() => {
  app.listen(PORT, HOST, () => {
    console.log(`STATECH website running at http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
    if (HOST === '0.0.0.0') {
      console.log(`Network access: http://<your-ip>:${PORT}`);
    }
    console.log(`Admin panel: /admin`);
    console.log(`Team login:  /login`);
    if (!isProduction) {
      console.log('Running in development mode. Set NODE_ENV=production for live hosting.');
    }
    if (process.env.SESSION_SECRET === 'change-this-to-a-secure-random-string' || !process.env.SESSION_SECRET) {
      console.warn('WARNING: Set a strong SESSION_SECRET in your .env file before going live.');
    }
  });
});
