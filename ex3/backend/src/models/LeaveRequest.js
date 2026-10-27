import mongoose from 'mongoose';

const leaveRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  leaveType: { type: String, enum: ['Casual Leave', 'Medical Leave'], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalDays: { type: Number, required: true, min: 1 },
  reason: { type: String, trim: true, maxlength: 500, default: '' },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'], default: 'Pending', index: true },
  managerRemarks: { type: String, trim: true, maxlength: 500, default: '' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date, default: null }
}, { timestamps: true });

leaveRequestSchema.index({ user: 1, startDate: 1, endDate: 1 });
export default mongoose.model('LeaveRequest', leaveRequestSchema);
