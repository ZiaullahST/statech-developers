const bcrypt = require('bcryptjs');
const { readJson, writeJson } = require('./db');

function getUsers() {
  return readJson('users.json', []);
}

function saveUsers(users) {
  writeJson('users.json', users);
}

function findUserByEmail(email) {
  const users = getUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

function findUserById(id) {
  const users = getUsers();
  return users.find((u) => u.id === id);
}

async function createUser({ email, password, name, role = 'editor' }) {
  const users = getUsers();
  if (findUserByEmail(email)) {
    throw new Error('User already exists');
  }
  const hash = await bcrypt.hash(password, 12);
  const user = {
    id: 'u' + Date.now(),
    email: email.toLowerCase(),
    password: hash,
    name: name || email.split('@')[0],
    role,
    createdAt: new Date().toISOString()
  };
  users.push(user);
  saveUsers(users);
  return sanitizeUser(user);
}

async function verifyPassword(user, password) {
  return bcrypt.compare(password, user.password);
}

async function updateUserPassword(userId, newPassword) {
  const users = getUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) throw new Error('User not found');
  users[index].password = await bcrypt.hash(newPassword, 12);
  saveUsers(users);
}

function deleteUser(userId) {
  const users = getUsers();
  const filtered = users.filter((u) => u.id !== userId);
  if (filtered.length === users.length) throw new Error('User not found');
  saveUsers(filtered);
}

function sanitizeUser(user) {
  const { password, ...safe } = user;
  return safe;
}

function listUsers() {
  return getUsers().map(sanitizeUser);
}

async function initializeDefaultAdmin() {
  const users = getUsers();
  if (users.length > 0) return;

  const email = process.env.ADMIN_EMAIL || 'admin@statech.com';
  const password = process.env.ADMIN_PASSWORD || 'changeme123';

  await createUser({
    email,
    password,
    name: 'Admin',
    role: 'admin'
  });

  console.log(`Default admin created: ${email}`);
  console.log('Change the default password after first login.');
}

module.exports = {
  getUsers,
  findUserByEmail,
  findUserById,
  createUser,
  verifyPassword,
  updateUserPassword,
  deleteUser,
  sanitizeUser,
  listUsers,
  initializeDefaultAdmin
};
