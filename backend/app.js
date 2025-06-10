import authRoute from "./routes/authRoute.js"
import dashboardRoute from './routes/dashboardRoute.js';
import videoRoute from "./routes/videoRoute.js"
import dotenv from 'dotenv';
import purchaseRoute from './routes/purchaseRoute.js';
import commentRoute from './routes/commentRoute.js'
import { verifyToken } from "./middleware/auth.js";
import express from "express";
import mongoose from "mongoose";
import cors from 'cors';
import path from 'path'
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();

// Ensure required environment variables are set
const requiredEnvVars = ['MONGO_URL', 'JWT_SECRET'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Error: ${envVar} environment variable is required but not set.`);
    process.exit(1);
  }
}

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log("DB connected successfully");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Middleware
app.use(cors());
app.use(express.json());

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Routes
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/dashboard", verifyToken, dashboardRoute);
app.use("/api/v1/videos", videoRoute);
app.use('/api/v1/purchase', verifyToken, purchaseRoute);
app.use("/api/v1/comments", commentRoute);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// Start server
const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

