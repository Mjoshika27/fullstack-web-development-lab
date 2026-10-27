const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const protect = require('../middleware/auth');
const serializeUser = require('../utils/serializeUser');

const router = express.Router();
router.use(protect);

router.get('/suggestions', async (req, res, next) => {
  try {
    const excludeIds = [req.user._id, ...req.user.following];
    const users = await User.find({ _id: { $nin: excludeIds } })
      .select('name username bio avatarUrl followers following postsCount createdAt')
      .sort({ createdAt: -1 })
      .limit(8);
    res.json({ users: users.map(serializeUser) });
  } catch (error) {
    next(error);
  }
});

router.get('/search', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim().slice(0, 80);
    if (!q) return res.json({ users: [] });
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { name: { $regex: escaped, $options: 'i' } },
        { username: { $regex: escaped.replace(/^@/, ''), $options: 'i' } }
      ]
    }).select('name username bio avatarUrl followers following postsCount').limit(12);
    res.json({ users: users.map(serializeUser) });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/follow', async (req, res, next) => {
  try {
    const targetId = req.params.id;
    if (!mongoose.isValidObjectId(targetId)) return res.status(400).json({ message: 'Invalid user.' });
    if (targetId === req.userId) return res.status(400).json({ message: 'You cannot follow yourself.' });

    const target = await User.findById(targetId);
    if (!target) return res.status(404).json({ message: 'User not found.' });

    await Promise.all([
      User.updateOne({ _id: req.userId }, { $addToSet: { following: target._id } }),
      User.updateOne({ _id: target._id }, { $addToSet: { followers: req.user._id } })
    ]);
    const user = await User.findById(req.userId);
    res.json({ user: serializeUser(user), message: `You are now following @${target.username}.` });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id/follow', async (req, res, next) => {
  try {
    const targetId = req.params.id;
    if (!mongoose.isValidObjectId(targetId)) return res.status(400).json({ message: 'Invalid user.' });
    if (targetId === req.userId) return res.status(400).json({ message: 'You cannot unfollow yourself.' });

    const target = await User.findById(targetId);
    if (!target) return res.status(404).json({ message: 'User not found.' });

    await Promise.all([
      User.updateOne({ _id: req.userId }, { $pull: { following: target._id } }),
      User.updateOne({ _id: target._id }, { $pull: { followers: req.user._id } })
    ]);
    const user = await User.findById(req.userId);
    res.json({ user: serializeUser(user), message: `You unfollowed @${target.username}.` });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid user.' });
    const user = await User.findById(req.params.id).select('name username bio avatarUrl followers following postsCount');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    const postsCount = await Post.countDocuments({ author: user._id });
    user.postsCount = postsCount;
    res.json({ user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
