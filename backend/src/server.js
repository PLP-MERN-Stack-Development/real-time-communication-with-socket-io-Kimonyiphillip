const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const { connectDB } = require("./config/db");
const { socketAuthMiddleware } = require("./middleware/socketAuth");

dotenv.config();

const app = express();
const httpServer = http.createServer(app);

connectDB();

// CORS Configuration
const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.ALLOWED_ORIGIN || "")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);

const defaultOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];

const corsOrigins = allowedOrigins.length > 0 ? allowedOrigins : defaultOrigins;

if (process.env.NODE_ENV !== "production") {
  const timestamp = new Date().toISOString();
  process.stdout.write(`[${timestamp}] CORS origins: ${corsOrigins.join(", ")}\n`);
}

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || corsOrigins.includes(origin) || corsOrigins.includes("*")) {
      callback(null, true);
    } else {
      if (process.env.NODE_ENV !== "production") {
        process.stderr.write(`[CORS] Blocked origin: ${origin}\n`);
      }
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-User-Id"],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  maxAge: 600
};

app.use(cors(corsOptions));

// Socket.io Configuration
const io = new Server(httpServer, {
  cors: {
    origin: corsOrigins,
    credentials: true,
    methods: ["GET", "POST"]
  }
});

global.io = io;

// Enhanced user presence tracking with online status
const userPresence = new Map();

// Socket.io middleware for authentication
io.use(socketAuthMiddleware);

// Middleware
app.use(express.json({ limit: "10mb" })); // Increased for file uploads
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Basic routes
app.get("/", (req, res) => res.send("Chat API OK"));
app.get("/healthz", (req, res) => res.json({ status: "ok" }));

// API Routes
const conversationRoutes = require("./routes/conversationRoutes");
const messageRoutes = require("./routes/messageRoutes");
const userRoutes = require("./routes/userRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/upload", uploadRoutes);

// Global chat room initialization
const { ensureGlobalRoom } = require("./utils/globalRoom");
ensureGlobalRoom();

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: "Not Found" });
});

// Error Handler
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  const response = {
    message: err.message || "Internal server error"
  };
  if (process.env.NODE_ENV !== "production") {
    response.stack = err.stack;
  }
  res.status(status).json(response);
});

// Enhanced Socket.io Event Handlers
io.on("connection", (socket) => {
  const { userId } = socket.data;
  
  if (userId) {
    // User comes online
    userPresence.set(userId, {
      socketId: socket.id,
      status: "online",
      lastSeen: new Date()
    });
    
    // Broadcast user online status to all connected clients
    socket.broadcast.emit("user:status", {
      userId,
      status: "online",
      lastSeen: new Date()
    });
    
    // Join user's personal room for private notifications
    socket.join(userId);
    
    // Join global room by default
    socket.join("global");
  }

  // Conversation management
  socket.on("conversation:join", (conversationId) => {
    if (conversationId) {
      socket.join(conversationId);
    }
  });

  socket.on("conversation:leave", (conversationId) => {
    if (conversationId) {
      socket.leave(conversationId);
    }
  });

  // Typing indicators
  socket.on("typing:start", (data) => {
    const { conversationId } = data;
    if (conversationId) {
      socket.to(conversationId).emit("typing:start", {
        userId: socket.data.userId,
        conversationId
      });
    }
  });

  socket.on("typing:stop", (data) => {
    const { conversationId } = data;
    if (conversationId) {
      socket.to(conversationId).emit("typing:stop", {
        userId: socket.data.userId,
        conversationId
      });
    }
  });

  // Message reactions
  socket.on("message:react", async (data) => {
    const { messageId, conversationId, reaction } = data;
    if (messageId && conversationId && reaction) {
      // Broadcast reaction to all users in conversation
      socket.to(conversationId).emit("message:react", {
        messageId,
        userId: socket.data.userId,
        reaction,
        conversationId
      });
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    if (userId) {
      // Update user status to offline
      userPresence.set(userId, {
        socketId: null,
        status: "offline",
        lastSeen: new Date()
      });
      
      // Broadcast user offline status
      socket.broadcast.emit("user:status", {
        userId,
        status: "offline",
        lastSeen: new Date()
      });
    }
  });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  if (process.env.NODE_ENV !== "production") {
    const timestamp = new Date().toISOString();
    process.stdout.write(`[${timestamp}] Server ready on http://localhost:${PORT}\n`);
  }
});
