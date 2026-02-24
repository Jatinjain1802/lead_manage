const express = require("express");
const cors = require("cors");
const routes = require("./routes");

const app = express();

// Middleware
const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : true;

app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: "16mb" }));
app.use(express.urlencoded({ extended: true, limit: "16mb" }));
app.use('/uploads', express.static('uploads'));

// Routes
app.use("/api", routes);

// Global Error Handler
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);
  return res.status(500).json({ error: "Internal server error" });
});

module.exports = app;
