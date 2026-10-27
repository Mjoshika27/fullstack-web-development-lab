import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ message: 'Please sign in to continue.' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'development_only_change_me');
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
  }
}

export function requireRole(...allowedRoles) {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.userId);
      if (!user) return res.status(401).json({ message: 'Account not found. Please sign in again.' });
      const role = user.role || 'employee';
      if (!allowedRoles.includes(role)) {
        return res.status(403).json({ message: role === 'manager' ? 'This action is available only to employees.' : 'Manager access is required for this action.' });
      }
      req.currentUser = user;
      next();
    } catch (error) {
      next(error);
    }
  };
}
