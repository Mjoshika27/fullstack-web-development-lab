const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Post = require('../models/Post');
const protect = require('../middleware/auth');
const serializeUser = require('../utils/serializeUser');

const router = express.Router();

function createToken(user) {
  return jwt.sign(
    { userId: user._id.toString() },
    process.env.JWT_SECRET || 'development-only-change-me',
    { expiresIn: '7d' }
  );
}

router.post('/register', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const username = String(req.body.username || '').trim().toLowerCase();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (name.length < 2) return res.status(400).json({ message: 'Enter your name (at least 2 characters).' });
    if (!/^[a-z0-9_]{3,24}$/.test(username)) {
      return res.status(400).json({ message: 'Username must be 3–24 characters and use only letters, numbers or underscores.' });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Enter a valid email address.' });
    if (password.length < 8) return res.status(400).json({ message: 'Password must contain at least 8 characters.' });

    const duplicate = await User.findOne({ $or: [{ email }, { username }] });
    if (duplicate) {
      return res.status(409).json({ message: duplicate.email === email ? 'An account already exists with this email.' : 'That username is already taken.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, username, email, passwordHash, bio: 'New to MiniBlog ✨' });
    res.status(201).json({ token: createToken(user), user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const identity = String(req.body.email || req.body.username || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!identity || !password) return res.status(400).json({ message: 'Enter your email/username and password.' });

    const user = await User.findOne({ $or: [{ email: identity }, { username: identity.replace(/^@/, '') }] }).select('+passwordHash');
    const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!valid) return res.status(401).json({ message: 'The login details do not match. Please try again.' });

    res.json({ token: createToken(user), user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
});

router.get('/me', protect, async (req, res, next) => {
  try {
    const [user, postsCount] = await Promise.all([
      User.findById(req.userId),
      Post.countDocuments({ author: req.userId })
    ]);
    if (!user) return res.status(404).json({ message: 'Account not found.' });
    user.postsCount = postsCount;
    res.json({ user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
