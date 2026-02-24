const { pool } = require("../config/db");

const CREATE_LEADS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS leads (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(30) NOT NULL UNIQUE,
  name VARCHAR(120) NULL,
  source VARCHAR(80) NOT NULL DEFAULT 'unknown',
  status VARCHAR(40) NOT NULL DEFAULT 'new',
  assigned_to VARCHAR(120) NULL,
  notes TEXT NULL,
  follow_up_at DATETIME NULL,
  last_call_outcome VARCHAR(255) NULL,
  last_called_at DATETIME NULL,
  last_message TEXT NULL,
  last_message_at DATETIME NULL,
  raw_payload JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_assigned_to (assigned_to),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

async function ensureLeadTable() {
  await pool.query(CREATE_LEADS_TABLE_SQL);
}

async function upsertLead(lead, rawPayload) {
  const payloadJson = rawPayload ? JSON.stringify(rawPayload) : null;
  const sql = `
    INSERT INTO leads (
      phone, name, source, status, last_message, last_message_at, raw_payload
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      name = COALESCE(?, name),
      last_message = COALESCE(?, last_message),
      last_message_at = COALESCE(?, last_message_at),
      raw_payload = ?,
      updated_at = CURRENT_TIMESTAMP
  `;

  const params = [
    lead.phone,
    lead.name,
    lead.source,
    lead.status,
    lead.lastMessage,
    lead.lastMessageAt,
    payloadJson,
    lead.name,
    lead.lastMessage,
    lead.lastMessageAt,
    payloadJson,
  ];

  await pool.query(sql, params);
}

async function getLeadById(id) {
  const [rows] = await pool.query(
    `
      SELECT
        id,
        phone,
        name,
        source,
        status,
        assigned_to AS assignedTo,
        notes,
        follow_up_at AS followUpAt,
        last_call_outcome AS lastCallOutcome,
        last_called_at AS lastCalledAt,
        last_message AS lastMessage,
        last_message_at AS lastMessageAt,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM leads
      WHERE id = ?
      LIMIT 1
    `,
    [id]
  );
  return rows[0] || null;
}

async function getAllLeads({ status, assignedTo, search, limit = 100 }) {
  let sql = `
    SELECT
      id,
      phone,
      name,
      source,
      status,
      assigned_to AS assignedTo,
      notes,
      follow_up_at AS followUpAt,
      last_call_outcome AS lastCallOutcome,
      last_called_at AS lastCalledAt,
      last_message AS lastMessage,
      last_message_at AS lastMessageAt,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM leads
    WHERE 1 = 1
  `;
  const params = [];

  if (status) {
    sql += " AND status = ?";
    params.push(status);
  }

  if (assignedTo) {
    sql += " AND assigned_to = ?";
    params.push(assignedTo);
  }

  if (search) {
    const like = `%${search}%`;
    sql += " AND (phone LIKE ? OR name LIKE ? OR notes LIKE ?)";
    params.push(like, like, like);
  }

  sql += " ORDER BY created_at DESC LIMIT ?";
  params.push(limit);

  const [rows] = await pool.query(sql, params);
  return rows;
}

async function updateLead(id, updates, params) {
  const sql = `
    UPDATE leads
    SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  params.push(id);

  const [result] = await pool.query(sql, params);
  return result;
}

async function findLeadByPhone(phone) {
  const [rows] = await pool.query(
    `
      SELECT
        id, phone, name, source, status,
        assigned_to AS assignedTo, notes,
        follow_up_at AS followUpAt,
        last_call_outcome AS lastCallOutcome,
        last_called_at AS lastCalledAt,
        last_message AS lastMessage,
        last_message_at AS lastMessageAt,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM leads
      WHERE phone = ?
      LIMIT 1
    `,
    [phone]
  );
  return rows[0] || null;
}

module.exports = {
  ensureLeadTable,
  upsertLead,
  getLeadById,
  getAllLeads,
  updateLead,
  findLeadByPhone,
};
