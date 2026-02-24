const app = require("./src/app");
const http = require("http");
const { testConnection } = require("./src/config/db");
const { ensureLeadTable } = require("./src/models/leadModel");
const { ensureUsersTable, findByUsername, createUser } = require("./src/models/userModel");
const { ensureMessagesTable } = require("./src/models/messageModel");
const { ensureActivitiesTable } = require("./src/models/activityModel");
const socket = require("./src/utils/socket");

const PORT = Number(process.env.PORT || 5000);
const server = http.createServer(app);

// Initialize Socket.io
socket.init(server);

async function seedAdmin() {
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  
  const existing = await findByUsername(adminUsername);
  if (!existing) {
    await createUser({
      username: adminUsername,
      password: adminPassword,
      name: "Super Admin",
      role: "admin",
      canViewChat: true
    });
    console.log(`Default admin created: ${adminUsername}`);
  }
}

async function start() {
  try {
    await testConnection();
    console.log("Database connected successfully.");

    await ensureUsersTable();
    await seedAdmin();
    await ensureLeadTable();
    await ensureMessagesTable();
    await ensureActivitiesTable();
    console.log("Database schema verified.");

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

start();
