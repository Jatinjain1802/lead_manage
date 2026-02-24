const { pool } = require("../config/db");
const bcrypt = require("bcryptjs");

const CREATE_USERS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role ENUM('admin', 'agent') NOT NULL DEFAULT 'agent',
  can_view_chat BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

async function ensureUsersTable() {
  await pool.query(CREATE_USERS_TABLE_SQL);
}

async function createUser({ username, password, name, role = 'agent', canViewChat = false }) {
  const hashedPassword = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    "INSERT INTO users (username, password, name, role, can_view_chat) VALUES (?, ?, ?, ?, ?)",
    [username, hashedPassword, name, role, canViewChat]
  );
  return result.insertId;
}

async function findByUsername(username) {
  const [rows] = await pool.query("SELECT * FROM users WHERE username = ?", [username]);
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.query("SELECT id, username, name, role, can_view_chat, is_active FROM users WHERE id = ?", [id]);
  return rows[0] || null;
}

async function getAllUsers() {
  const [rows] = await pool.query("SELECT id, username, name, role, can_view_chat, is_active FROM users");
  return rows;
}

async function updateUser(id, { name, role, canViewChat, isActive }) {
  const updates = [];
  const params = [];

  if (name !== undefined) { updates.push("name = ?"); params.push(name); }
  if (role !== undefined) { updates.push("role = ?"); params.push(role); }
  if (canViewChat !== undefined) { updates.push("can_view_chat = ?"); params.push(canViewChat); }
  if (isActive !== undefined) { updates.push("is_active = ?"); params.push(isActive); }

  if (updates.length === 0) return null;

  params.push(id);
  const [result] = await pool.query(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, params);
  return result;
}

module.exports = {
  ensureUsersTable,
  createUser,
  findByUsername,
  findById,
  getAllUsers,
  updateUser,
};
