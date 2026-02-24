const { pool } = require("../config/db");

const CREATE_LEADS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS leads (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(30) NOT NULL UNIQUE,
  name VARCHAR(120) NULL,
  source VARCHAR(80) NOT NULL DEFAULT 'unknown',
  status VARCHAR(40) NOT NULL DEFAULT 'new',
  assigned_to_id INT UNSIGNED NULL,
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
  INDEX idx_assigned_to (assigned_to_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

async function ensureLeadTable() {
  await pool.query(CREATE_LEADS_TABLE_SQL);
  // Optional: Add column if it doesn't exist (Migration)
  try {
    const [columns] = await pool.query("SHOW COLUMNS FROM leads LIKE 'assigned_to_id'");
    if (columns.length === 0) {
      await pool.query("ALTER TABLE leads ADD COLUMN assigned_to_id INT UNSIGNED NULL AFTER status");
      await pool.query("ALTER TABLE leads ADD INDEX idx_assigned_to (assigned_to_id)");
    }
  } catch (err) {
    console.warn("Migration check failed:", err.message);
  }
}

async function upsertLead(lead, rawPayload) {
  const payloadJson = rawPayload ? JSON.stringify(rawPayload) : null;
  const sql = `
    INSERT INTO leads (
      phone, name, source, status, last_message, last_message_at, raw_payload
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      name = COALESCE(?, name),
      status = CASE 
        WHEN status = 'new' THEN ? 
        ELSE status 
      END,
      last_message = ?,
      last_message_at = ?,
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
    // For Update:
    lead.name,
    lead.status, // Only updates if old status was 'new'
    lead.lastMessage,
    lead.lastMessageAt,
    payloadJson,
  ];

  const [result] = await pool.query(sql, params);
  
  // Return the lead ID
  if (result.insertId) return result.insertId;
  
  const [rows] = await pool.query("SELECT id FROM leads WHERE phone = ?", [lead.phone]);
  return rows[0].id;
}

async function getLeadById(id) {
  const [rows] = await pool.query(
    `
      SELECT
        l.id, l.phone, l.name, l.source, l.status, l.assigned_to_id, l.notes, l.raw_payload,
        l.last_message AS lastMessage,
        l.last_message_at AS lastMessageAt,
        l.last_call_outcome AS lastCallOutcome,
        l.last_called_at AS lastCalledAt,
        l.follow_up_at AS followUpAt,
        l.created_at, l.updated_at,
        u.name AS assignedToName
      FROM leads l
      LEFT JOIN users u ON l.assigned_to_id = u.id
      WHERE l.id = ?
      LIMIT 1
    `,
    [id]
  );
  return rows[0] || null;
}

async function getAllLeads({ status, assignedToId, search, limit = 100 }) {
  let sql = `
    SELECT
      l.id, l.phone, l.name, l.source, l.status, l.assigned_to_id, l.notes, l.raw_payload,
      l.last_message AS lastMessage,
      l.last_message_at AS lastMessageAt,
      l.last_call_outcome AS lastCallOutcome,
      l.last_called_at AS lastCalledAt,
      l.follow_up_at AS followUpAt,
      l.created_at, l.updated_at,
      u.name AS assignedToName
    FROM leads l
    LEFT JOIN users u ON l.assigned_to_id = u.id
    WHERE 1 = 1
  `;
  const params = [];

  if (status) {
    sql += " AND l.status = ?";
    params.push(status);
  }

  if (assignedToId) {
    sql += " AND l.assigned_to_id = ?";
    params.push(assignedToId);
  }

  if (search) {
    const like = `%${search}%`;
    sql += " AND (l.phone LIKE ? OR l.name LIKE ? OR l.notes LIKE ?)";
    params.push(like, like, like);
  }

  sql += " ORDER BY l.created_at DESC LIMIT ?";
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
    "SELECT * FROM leads WHERE phone = ? LIMIT 1",
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
