const { pool } = require("../config/db");
const { LEAD_STATUSES } = require("../config/constants");

const getAnalytics = async (req, res) => {
  try {
    // 1. Total Leads count
    const [[{ totalLeads }]] = await pool.query("SELECT COUNT(*) as totalLeads FROM leads");

    // 2. Leads by Status breakdown
    const [statusRows] = await pool.query(
      "SELECT status, COUNT(*) as count FROM leads GROUP BY status"
    );
    
    // Ensure all statuses are present even if count is 0
    const statusBreakdown = Array.from(LEAD_STATUSES).reduce((acc, status) => {
      const found = statusRows.find(row => row.status === status);
      acc[status] = found ? found.count : 0;
      return acc;
    }, {});

    // 3. Agent Performance (Leads assigned + conversion rate)
    const [agentRows] = await pool.query(`
      SELECT 
        u.id, 
        u.name, 
        COUNT(l.id) as totalAssigned,
        SUM(CASE WHEN l.status = 'converted' THEN 1 ELSE 0 END) as convertedCount
      FROM users u
      LEFT JOIN leads l ON u.id = l.assigned_to_id
      WHERE u.role = 'agent'
      GROUP BY u.id, u.name
    `);

    // 4. Leads Trend (Last 7 days)
    const [trendRows] = await pool.query(`
      SELECT 
        DATE(created_at) as date, 
        COUNT(*) as count 
      FROM leads 
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    res.json({
      summary: {
        totalLeads,
        totalAgents: agentRows.length,
        conversions: statusBreakdown.converted || 0
      },
      statusBreakdown,
      agentPerformance: agentRows,
      trend: trendRows
    });
  } catch (err) {
    console.error("Analytics Error:", err);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
};

module.exports = {
  getAnalytics
};
