const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Please sign in to continue.' });

    const payload = jwt.verify(token, process.env.JWT_SECRET || 'development-only-change-me');
    const user = await User.findById(payload.userId);
    if (!user) return res.status(401).json({ message: 'Your session is no longer valid. Please sign in again.' });

    req.user = user;
    req.userId = user._id.toString();
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
  }
}

module.exports = protect;
