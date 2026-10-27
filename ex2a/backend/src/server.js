import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import menuRoutes from './routes/menu.js';
import orderRoutes from './routes/orders.js';
import MenuItem from './models/MenuItem.js';
import { menuSeed } from './data/menu.js';

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/spice_garden';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    status: connected ? 'ok' : 'error',
    app: 'Spice Garden API',
    database: connected ? 'connected' : 'disconnected'
  });
});

app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);

app.use((req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` }));

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: 'Something went wrong on the server. Check the backend terminal.' });
});

async function start() {
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 8000 });
    const count = await MenuItem.countDocuments();
    if (count === 0) {
      await MenuItem.insertMany(menuSeed);
      console.log(`Added ${menuSeed.length} sample menu items.`);
    }
    app.listen(PORT, () => {
      console.log(`Spice Garden API running at http://localhost:${PORT}`);
      console.log(`MongoDB connected: ${mongoose.connection.name}`);
    });
  } catch (error) {
    console.error('Could not connect to MongoDB. Start the MongoDB service and check backend/.env.');
    console.error(error.message);
    process.exit(1);
  }
}

start();
