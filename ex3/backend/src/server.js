import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import leaveRoutes from './routes/leaves.js';
import LeaveRequest from './models/LeaveRequest.js';

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/leave_management';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({
  origin(origin, callback) {
    const isLocalDev = !origin || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
    if (isLocalDev || origin === CLIENT_URL) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS. Check CLIENT_URL in backend/.env.'));
  }
}));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    status: connected ? 'ok' : 'error',
    app: 'Leave Management API',
    database: connected ? 'connected' : 'disconnected'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/leaves', leaveRoutes);
app.use((req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` }));
app.use((error, _req, res, _next) => {
  console.error(error);
  if (error?.code === 11000) return res.status(409).json({ message: 'Email or roll number is already registered.' });
  if (error?.name === 'ValidationError' || error?.name === 'CastError') return res.status(400).json({ message: error.message });
  return res.status(500).json({ message: 'Server error. Check the backend terminal.' });
});

async function start() {
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 8000 });
    // Records from the earlier lab version were deducted at submission time.
    // Mark those legacy requests Approved so the new manager workflow will not deduct them twice.
    await LeaveRequest.updateMany({ status: 'Applied' }, { $set: { status: 'Approved' } });
    app.listen(PORT, () => {
      console.log(`Leave Management API running at http://localhost:${PORT}`);
      console.log(`MongoDB connected: ${mongoose.connection.name}`);
    });
  } catch (error) {
    console.error('Could not connect to MongoDB. Start the MongoDB service and check backend/.env.');
    console.error(error.message);
    process.exit(1);
  }
}

start();
