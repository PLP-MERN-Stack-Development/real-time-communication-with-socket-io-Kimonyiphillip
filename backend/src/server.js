const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { connectDB } = require("./config/db");
const conversationRoutes = require("./routes/conversationRoutes");
const messageRoutes = require("./routes/messageRoutes");
const userRoutes = require("./routes/userRoutes");

dotenv.config();

const app = express();
connectDB();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.ALLOWED_ORIGIN || "")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins.length ? allowedOrigins : "*",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
}));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => res.send("Chat API OK"));
app.get("/healthz", (req, res) => res.json({ status: "ok" }));

app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Not Found" });
});

app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  const status = err.statusCode || 500;
  const response = {
    message: err.message || "Internal server error"
  };
  if (process.env.NODE_ENV !== "production") {
    response.stack = err.stack;
  }
  console.error("API error:", err);
  res.status(status).json(response);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Chat API on http://localhost:${PORT}`);
});
