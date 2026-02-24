const { pool } = require("../config/db");

const CREATE_MESSAGES_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS messages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lead_id BIGINT UNSIGNED NOT NULL,
  sender_type ENUM('customer', 'system', 'agent') NOT NULL,
  sender_id INT UNSIGNED NULL,
  message_text TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text',
  metadata JSON NULL,
  raw_payload JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  INDEX idx_lead (lead_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

async function ensureMessagesTable() {
  await pool.query(CREATE_MESSAGES_TABLE_SQL);
  // Migration check for metadata column
  try {
    const [cols] = await pool.query("SHOW COLUMNS FROM messages LIKE 'metadata'");
    if (cols.length === 0) {
      await pool.query("ALTER TABLE messages ADD COLUMN metadata JSON NULL AFTER message_type");
    }
  } catch (err) {
    console.warn("Messages migration check failed:", err.message);
  }
}

async function createMessage({ leadId, senderType, senderId = null, messageText, messageType = 'text', rawPayload = null, metadata = null }) {
  const payloadJson = rawPayload ? JSON.stringify(rawPayload) : null;
  const metadataJson = metadata ? (typeof metadata === 'string' ? metadata : JSON.stringify(metadata)) : null;
  const [result] = await pool.query(
    "INSERT INTO messages (lead_id, sender_type, sender_id, message_text, message_type, raw_payload, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [leadId, senderType, senderId, messageText, messageType, payloadJson, metadataJson]
  );
  return result.insertId;
}

async function getMessagesByLeadId(leadId) {
  const [rows] = await pool.query(
    "SELECT m.*, u.name as agent_name FROM messages m LEFT JOIN users u ON m.sender_id = u.id WHERE m.lead_id = ? ORDER BY m.created_at ASC",
    [leadId]
  );
  return rows;
}

module.exports = {
  ensureMessagesTable,
  createMessage,
  getMessagesByLeadId,
};
