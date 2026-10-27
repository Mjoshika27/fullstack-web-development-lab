import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  rollNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['employee', 'manager'], default: 'employee', index: true },
  casualLeaveBalance: { type: Number, default: 10, min: 0 },
  medicalLeaveBalance: { type: Number, default: 10, min: 0 }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
