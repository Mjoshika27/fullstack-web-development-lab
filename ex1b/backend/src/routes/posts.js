const express = require('express');
const mongoose = require('mongoose');
const Post = require('../models/Post');
const User = require('../models/User');
const protect = require('../middleware/auth');

const router = express.Router();
router.use(protect);

function authorSummary(user) {
  if (!user) return null;
  return {
    id: user._id.toString(),
    name: user.name,
    username: user.username,
    avatarUrl: user.avatarUrl || ''
  };
}

function serializePost(post, currentUserId) {
  return {
    id: post._id.toString(),
    content: post.content || '',
    imageUrl: post.imageUrl || '',
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    author: authorSummary(post.author),
    likesCount: post.likes.length,
    likedByMe: post.likes.some((id) => id.toString() === currentUserId),
    commentsCount: post.comments.length,
    comments: post.comments.map((comment) => ({
      id: comment._id.toString(),
      text: comment.text,
      createdAt: comment.createdAt,
      author: authorSummary(comment.author)
    }))
  };
}

async function populatedPost(id, currentUserId) {
  const post = await Post.findById(id)
    .populate('author', 'name username avatarUrl')
    .populate('comments.author', 'name username avatarUrl');
  return post ? serializePost(post, currentUserId) : null;
}

router.get('/feed', async (req, res, next) => {
  try {
    const mode = String(req.query.mode || 'for-you');
    const q = String(req.query.q || '').trim().slice(0, 100);
    const filter = {};

    if (mode === 'following') {
      filter.author = { $in: [...req.user.following, req.user._id] };
    } else if (mode === 'profile') {
      filter.author = req.user._id;
    }

    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const matchingUsers = await User.find({
        $or: [
          { name: { $regex: escaped, $options: 'i' } },
          { username: { $regex: escaped.replace(/^@/, ''), $options: 'i' } }
        ]
      }).select('_id');
      filter.$or = [
        { content: { $regex: escaped, $options: 'i' } },
        { author: { $in: matchingUsers.map((user) => user._id) } }
      ];
    }

    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('author', 'name username avatarUrl')
      .populate('comments.author', 'name username avatarUrl');

    res.json({ posts: posts.map((post) => serializePost(post, req.userId)) });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const content = String(req.body.content || '').trim();
    const imageUrl = String(req.body.imageUrl || '').trim();
    if (!content && !imageUrl) return res.status(400).json({ message: 'Write something or attach an image before posting.' });
    if (content.length > 1000) return res.status(400).json({ message: 'Posts can contain up to 1,000 characters.' });
    if (imageUrl && !/^https?:\/\//i.test(imageUrl)) return res.status(400).json({ message: 'The image URL is not valid.' });

    const post = await Post.create({ author: req.user._id, content, imageUrl });
    await User.updateOne({ _id: req.userId }, { $inc: { postsCount: 1 } });
    res.status(201).json({ post: await populatedPost(post._id, req.userId), message: 'Your post is live.' });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/like', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid post.' });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found.' });
    const liked = post.likes.some((id) => id.toString() === req.userId);
    if (liked) post.likes.pull(req.user._id);
    else post.likes.addToSet(req.user._id);
    await post.save();
    res.json({ post: await populatedPost(post._id, req.userId), liked: !liked });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/comments', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid post.' });
    const text = String(req.body.text || '').trim();
    if (!text) return res.status(400).json({ message: 'Write a comment first.' });
    if (text.length > 500) return res.status(400).json({ message: 'Comments can contain up to 500 characters.' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found.' });
    post.comments.push({ author: req.user._id, text });
    await post.save();
    res.status(201).json({ post: await populatedPost(post._id, req.userId), message: 'Comment added.' });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid post.' });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found.' });
    if (post.author.toString() !== req.userId) return res.status(403).json({ message: 'You can only delete your own posts.' });

    await post.deleteOne();
    await User.updateOne({ _id: req.userId, postsCount: { $gt: 0 } }, { $inc: { postsCount: -1 } });
    res.json({ message: 'Post deleted.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
