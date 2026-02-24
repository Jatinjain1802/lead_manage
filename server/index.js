const app = require("./src/app");
const { testConnection } = require("./src/config/db");
const { ensureLeadTable } = require("./src/models/leadModel");

const PORT = Number(process.env.PORT || 5000);

async function start() {
  try {
    // 1. Test database connection
    await testConnection();
    console.log("Database connected successfully.");

    // 2. Run initial migrations (ensure table exists)
    await ensureLeadTable();
    console.log("Database schema verified.");

    // 3. Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`WhatsApp Webhook URL: http://your-domain.com/api/whatsapp/webhook`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

start();
