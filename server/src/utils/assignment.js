const { pool } = require("../config/db");

async function getNextAgentForAssignment() {
  // Logic: Find the last assigned agent and pick the next one in the list.
  // Or simpler: Find agents and pick the one with the fewest leads assigned TODAY.
  
  const [agents] = await pool.query(
    "SELECT id FROM users WHERE role = 'agent' AND is_active = TRUE"
  );

  if (agents.length === 0) return null;

  // Get the most recently assigned agent ID from leads
  const [lastLead] = await pool.query(
    "SELECT assigned_to_id FROM leads WHERE assigned_to_id IS NOT NULL ORDER BY id DESC LIMIT 1"
  );

  if (!lastLead.length) return agents[0].id;

  const lastAgentId = lastLead[0].assigned_to_id;
  const lastIndex = agents.findIndex(a => a.id === lastAgentId);
  
  // Round-robin: next in list or first if at end
  const nextIndex = (lastIndex + 1) % agents.length;
  return agents[nextIndex].id;
}

module.exports = {
  getNextAgentForAssignment,
};
