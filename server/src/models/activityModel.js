const { pool } = require("../config/db");

const CREATE_ACTIVITIES_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS activities (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lead_id BIGINT UNSIGNED NOT NULL,
  actor_id INT UNSIGNED NULL, -- User who performed the action
  type VARCHAR(50) NOT NULL, -- 'status_change', 'call_log', 'assignment', 'note'
  description TEXT NOT NULL,
  old_value VARCHAR(255) NULL,
  new_value VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  INDEX idx_lead (lead_id),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

async function ensureActivitiesTable() {
  await pool.query(CREATE_ACTIVITIES_TABLE_SQL);
}

async function logActivity({ leadId, actorId, type, description, oldValue = null, newValue = null }) {
  await pool.query(
    "INSERT INTO activities (lead_id, actor_id, type, description, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?)",
    [leadId, actorId, type, description, oldValue, newValue]
  );
}

async function getActivitiesByLead(leadId) {
  const [rows] = await pool.query(
    `SELECT a.*, u.name as actor_name 
     FROM activities a 
     LEFT JOIN users u ON a.actor_id = u.id 
     WHERE a.lead_id = ? 
     ORDER BY a.created_at DESC`,
    [leadId]
  );
  return rows;
}

module.exports = {
  ensureActivitiesTable,
  logActivity,
  getActivitiesByLead
};
