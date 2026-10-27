import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import listingRoutes from './routes/listings.js';
import inquiryRoutes from './routes/inquiries.js';
import Listing from './models/Listing.js';
import { listingSeed } from './data/listings.js';

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/reloop_market';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({ status: connected ? 'ok' : 'error', app: 'ReLoop Classifieds API', database: connected ? 'connected' : 'disconnected' });
});

app.use('/api/listings', listingRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use((req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` }));
app.use((error, _req, res, _next) => {
  console.error(error);
  if (error.name === 'ValidationError') return res.status(400).json({ message: error.message });
  res.status(500).json({ message: 'Server error. Check the backend terminal.' });
});

async function start() {
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 8000 });
    const count = await Listing.countDocuments();
    if (count === 0) {
      await Listing.insertMany(listingSeed.map(({ seedKey, ...item }) => item));
      console.log(`Added ${listingSeed.length} sample listings.`);
    }
    app.listen(PORT, () => {
      console.log(`ReLoop Classifieds API running at http://localhost:${PORT}`);
      console.log(`MongoDB connected: ${mongoose.connection.name}`);
    });
  } catch (error) {
    console.error('Could not connect to MongoDB. Start the MongoDB service and check backend/.env.');
    console.error(error.message);
    process.exit(1);
  }
}

start();
