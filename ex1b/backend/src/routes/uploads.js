const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const protect = require('../middleware/auth');

const router = express.Router();
const uploadDir = path.join(__dirname, '../../uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const safeExtension = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(extension) ? extension : '.jpg';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExtension}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) return cb(null, true);
    cb(new Error('Please upload an image file (JPG, PNG, GIF or WebP).'));
  }
});

router.post('/', protect, (req, res, next) => {
  upload.single('image')(req, res, (error) => {
    if (error) return next(error);
    if (!req.file) return res.status(400).json({ message: 'Choose an image to upload.' });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.status(201).json({ url: `${baseUrl}/uploads/${req.file.filename}` });
  });
});

module.exports = router;
