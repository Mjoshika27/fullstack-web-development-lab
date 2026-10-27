require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const uploadRoutes = require('./routes/uploads');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/miniblog';

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', app: 'MiniBlog API' }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/uploads', uploadRoutes);

app.use((req, res) => res.status(404).json({ message: 'That API route does not exist.' }));
app.use((error, _req, res, _next) => {
  console.error(error.message || error);
  if (error.name === 'MulterError' && error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'Images must be 5 MB or smaller.' });
  }
  if (error.message && error.message.startsWith('Please upload an image')) {
    return res.status(400).json({ message: error.message });
  }
  if (error.code === 11000) return res.status(409).json({ message: 'That email or username is already in use.' });
  if (error.name === 'ValidationError') return res.status(400).json({ message: 'Some of the submitted information is invalid.' });
  res.status(500).json({ message: 'Something went wrong on the server. Please try again.' });
});

mongoose.connect(MONGO_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`MiniBlog API running at http://localhost:${PORT}`));
  })
  .catch((error) => {
    console.error('Could not connect to MongoDB. Check that MongoDB is running and MONGO_URI is correct.');
    console.error(error.message);
    process.exit(1);
  });
