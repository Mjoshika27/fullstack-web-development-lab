import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/leave_management';

async function ensureAccount({ username, email, rollNumber, password, role, casualLeaveBalance, medicalLeaveBalance }) {
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      username,
      email,
      rollNumber,
      passwordHash: await bcrypt.hash(password, 10),
      role,
      casualLeaveBalance,
      medicalLeaveBalance
    });
    console.log(`Created ${role} demo account: ${email}`);
  } else {
    let changed = false;
    if (!user.role) { user.role = role; changed = true; }
    if (user.role !== role) {
      throw new Error(`The existing account ${email} has role "${user.role}". Resolve the email conflict before seeding the ${role} account.`);
    }
    if (changed) await user.save();
    console.log(`${role} demo account already exists; existing data was preserved: ${email}`);
  }
  return user;
}

async function seed() {
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 8000 });
    await ensureAccount({
      username: 'Kamali', email: 'kamali@demo.com', rollNumber: 'IT2026-01',
      password: 'demo12345', role: 'employee', casualLeaveBalance: 10, medicalLeaveBalance: 10
    });
    await ensureAccount({
      username: 'Leave Manager', email: 'manager@leaveease.com', rollNumber: 'MANAGER-001',
      password: 'manager12345', role: 'manager', casualLeaveBalance: 0, medicalLeaveBalance: 0
    });
    console.log('Employee login: kamali@demo.com / demo12345');
    console.log('Manager login: manager@leaveease.com / manager12345');
    console.log(`Database ready: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('Could not seed the database. Start MongoDB and check backend/.env.');
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seed();
