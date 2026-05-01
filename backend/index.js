// server.js
import express      from "express";
import dotenv       from "dotenv";
import cors         from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http"; // ← ADD THIS

import { connectDB } from "./db/connectDB.js";

import smartAttendanceRoutes from "./routes/smartAttendance.route.js";
import authRoutes            from "./routes/auth.route.js";
import fileRoutes            from "./routes/file.route.js";
import attendanceRoutes      from "./routes/attendance.route.js";
import todoRoutes            from "./routes/todo.routes.js";
import testimonialRoutes     from "./routes/testimonials.route.js";

import { initSocket } from "./modules/smartAttendance/socket/socketHandler.js";
import { getClientIP } from "./modules/smartAttendance/utils/ipHelpers.js";

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Create proper HTTP server ─────────────────────────────────────────────────
// CRITICAL: Socket.IO requires an http.Server, NOT the express app
const httpServer = createServer(app);

app.set('trust proxy', 1);

connectDB();

const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? [
        "https://last-minute-scsit.vercel.app",
        "https://lastminutescsit-api.vercel.app",
        "https://lastminutescsit.vercel.app",
      ]
    : [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
      ];

// ── CORS must be configured BEFORE initSocket ─────────────────────────────────
app.use(cors({
  origin:      allowedOrigins,
  methods:     ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// ── Init Socket.IO — pass httpServer + allowedOrigins ────────────────────────
initSocket(httpServer, allowedOrigins);

// ── Routes ────────────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.send("LastMinute SCSIT api running successfully!");
});

// Debug endpoint — verify IP detection is working
app.get("/api/debug/ip", (req, res) => {
  res.json({
    detectedIP:       getClientIP(req),
    expressIP:        req.ip,
    remoteAddress:    req.socket?.remoteAddress,
    xForwardedFor:    req.headers['x-forwarded-for'],
    cfConnectingIP:   req.headers['cf-connecting-ip'],
    xRealIP:          req.headers['x-real-ip'],
  });
});

app.use("/api/smart-attendance", smartAttendanceRoutes);
app.use("/api/auth",             authRoutes);
app.use("/api/files",            fileRoutes);
app.use("/api/attendance",       attendanceRoutes);
app.use("/api/todos",            todoRoutes);
app.use("/api/testimonials",     testimonialRoutes);

// ── Listen on httpServer NOT app ──────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});