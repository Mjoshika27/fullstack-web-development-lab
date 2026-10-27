import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function publicUser(user) {
  return {
    id: user._id,
    username: user.username,
    email: user.email,
    rollNumber: user.rollNumber,
    role: user.role || 'employee',
    casualLeaveBalance: user.casualLeaveBalance,
    medicalLeaveBalance: user.medicalLeaveBalance
  };
}

function tokenFor(user) {
  return jwt.sign({ userId: user._id.toString() }, process.env.JWT_SECRET || 'development_only_change_me', { expiresIn: '7d' });
}

async function signIn(req, res, next, expectedRole) {
  try {
    const { identifier, email, password } = req.body;
    const loginId = String(identifier || email || '').trim().toLowerCase();
    if (!loginId || typeof password !== 'string' || !password) {
      return res.status(400).json({ message: 'Enter your email and password.' });
    }
    const user = await User.findOne({ email: loginId });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    const role = user.role || 'employee';
    if (role !== expectedRole) {
      return res.status(403).json({ message: expectedRole === 'manager' ? 'This account is not a manager account. Choose Employee Login.' : 'This is a manager account. Choose Manager Login.' });
    }
    return res.json({ token: tokenFor(user), user: publicUser(user) });
  } catch (error) { next(error); }
}

router.post('/register', async (req, res, next) => {
  try {
    const { username, email, rollNumber, password, initialCasualLeave = 10, initialMedicalLeave = 10 } = req.body;
    if (![username, email, rollNumber, password].every(value => typeof value === 'string' && value.trim())) {
      return res.status(400).json({ message: 'Please fill in all required fields.' });
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return res.status(400).json({ message: 'Enter a valid email address.' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    const casual = Number(initialCasualLeave);
    const medical = Number(initialMedicalLeave);
    if (!Number.isInteger(casual) || casual < 0 || casual > 60 || !Number.isInteger(medical) || medical < 0 || medical > 60) {
      return res.status(400).json({ message: 'Initial leave balances must be whole numbers between 0 and 60.' });
    }
    const emailValue = email.trim().toLowerCase();
    const rollValue = rollNumber.trim().toUpperCase();
    const existing = await User.findOne({ $or: [{ email: emailValue }, { rollNumber: rollValue }] });
    if (existing) return res.status(409).json({ message: 'An account with that email or roll number already exists.' });

    const user = await User.create({
      username: username.trim(),
      email: emailValue,
      rollNumber: rollValue,
      passwordHash: await bcrypt.hash(password, 10),
      role: 'employee',
      casualLeaveBalance: casual,
      medicalLeaveBalance: medical
    });
    return res.status(201).json({ token: tokenFor(user), user: publicUser(user) });
  } catch (error) { next(error); }
});

router.post('/login', (req, res, next) => signIn(req, res, next, 'employee'));
router.post('/manager-login', (req, res, next) => signIn(req, res, next, 'manager'));

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'Account not found.' });
    return res.json({ user: publicUser(user) });
  } catch (error) { next(error); }
});

export default router;
