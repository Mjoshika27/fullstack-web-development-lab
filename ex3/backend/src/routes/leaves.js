import { Router } from 'express';
import mongoose from 'mongoose';
import LeaveRequest from '../models/LeaveRequest.js';
import User from '../models/User.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
const DAY_MS = 24 * 60 * 60 * 1000;
router.use(requireAuth);

function parseDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

function shapeRequest(item) {
  return {
    id: item._id,
    leaveType: item.leaveType,
    startDate: item.startDate.toISOString().slice(0, 10),
    endDate: item.endDate.toISOString().slice(0, 10),
    totalDays: item.totalDays,
    reason: item.reason,
    status: item.status,
    managerRemarks: item.managerRemarks || '',
    reviewedAt: item.reviewedAt || null,
    createdAt: item.createdAt
  };
}

function shapeManagerRequest(item) {
  const employee = item.user && typeof item.user === 'object' && item.user.username ? {
    id: item.user._id,
    username: item.user.username,
    email: item.user.email,
    rollNumber: item.user.rollNumber,
    casualLeaveBalance: item.user.casualLeaveBalance,
    medicalLeaveBalance: item.user.medicalLeaveBalance
  } : null;
  return { ...shapeRequest(item), employee };
}

async function employeeOverview(userId) {
  const [user, requests] = await Promise.all([
    User.findById(userId),
    LeaveRequest.find({ user: userId }).sort({ createdAt: -1 }).limit(100)
  ]);
  if (!user) return null;
  const pendingCasual = requests.filter(item => item.status === 'Pending' && item.leaveType === 'Casual Leave').reduce((sum, item) => sum + item.totalDays, 0);
  const pendingMedical = requests.filter(item => item.status === 'Pending' && item.leaveType === 'Medical Leave').reduce((sum, item) => sum + item.totalDays, 0);
  return {
    balance: {
      casual: Math.max(0, user.casualLeaveBalance - pendingCasual),
      medical: Math.max(0, user.medicalLeaveBalance - pendingMedical)
    },
    requests: requests.map(shapeRequest)
  };
}

router.get('/', requireRole('employee'), async (req, res, next) => {
  try {
    const overview = await employeeOverview(req.userId);
    if (!overview) return res.status(404).json({ message: 'Account not found.' });
    res.json(overview);
  } catch (error) { next(error); }
});

router.post('/', requireRole('employee'), async (req, res, next) => {
  try {
    const { leaveType, startDate: startValue, endDate: endValue, reason = '' } = req.body;
    if (!['Casual Leave', 'Medical Leave'].includes(leaveType)) {
      return res.status(400).json({ message: 'Select Casual Leave or Medical Leave.' });
    }
    const startDate = parseDate(startValue);
    const endDate = parseDate(endValue);
    if (!startDate || !endDate) return res.status(400).json({ message: 'Choose valid start and end dates.' });
    if (endDate < startDate) return res.status(400).json({ message: 'The end date cannot be earlier than the start date.' });
    const today = new Date(); today.setUTCHours(0, 0, 0, 0);
    if (startDate < today) return res.status(400).json({ message: 'Leave cannot start in the past.' });
    if (typeof reason !== 'string' || reason.trim().length > 500) return res.status(400).json({ message: 'Reason must be 500 characters or fewer.' });

    const totalDays = Math.round((endDate - startDate) / DAY_MS) + 1;
    const overlap = await LeaveRequest.findOne({
      user: req.userId,
      status: { $in: ['Pending', 'Approved'] },
      startDate: { $lte: endDate },
      endDate: { $gte: startDate }
    });
    if (overlap) return res.status(409).json({ message: 'These dates overlap with an existing pending or approved leave application.' });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'Account not found.' });
    const balanceField = leaveType === 'Casual Leave' ? 'casualLeaveBalance' : 'medicalLeaveBalance';
    const currentPending = await LeaveRequest.find({ user: req.userId, leaveType, status: 'Pending' });
    const reservedDays = currentPending.reduce((sum, item) => sum + item.totalDays, 0);
    const availableForRequests = user[balanceField] - reservedDays;
    if (availableForRequests < totalDays) {
      return res.status(400).json({ message: `Insufficient ${leaveType.toLowerCase()} balance after pending requests. Available: ${Math.max(0, availableForRequests)} day(s).` });
    }

    await LeaveRequest.create({ user: new mongoose.Types.ObjectId(req.userId), leaveType, startDate, endDate, totalDays, reason: reason.trim(), status: 'Pending' });
    const overview = await employeeOverview(req.userId);
    return res.status(201).json({ message: 'Leave application submitted. It is waiting for manager approval.', ...overview });
  } catch (error) { next(error); }
});

router.delete('/:id', requireRole('employee'), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid leave request.' });
    const request = await LeaveRequest.findOne({ _id: req.params.id, user: req.userId });
    if (!request) return res.status(404).json({ message: 'Leave request not found.' });
    if (!['Pending', 'Approved'].includes(request.status)) {
      return res.status(400).json({ message: 'Only pending or approved requests can be cancelled.' });
    }
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'Account not found.' });
    if (request.status === 'Approved') {
      if (request.leaveType === 'Casual Leave') user.casualLeaveBalance += request.totalDays;
      else user.medicalLeaveBalance += request.totalDays;
      await user.save();
    }
    request.status = 'Cancelled';
    await request.save();
    const overview = await employeeOverview(req.userId);
    return res.json({ message: request.status === 'Cancelled' ? 'Leave application cancelled.' : 'Leave application cancelled.', ...overview });
  } catch (error) { next(error); }
});

router.get('/manager/requests', requireRole('manager'), async (req, res, next) => {
  try {
    const allRequests = await LeaveRequest.find()
      .populate('user', 'username email rollNumber casualLeaveBalance medicalLeaveBalance')
      .sort({ createdAt: -1 })
      .limit(500);
    const counts = { all: allRequests.length, Pending: 0, Approved: 0, Rejected: 0, Cancelled: 0 };
    allRequests.forEach(item => { if (counts[item.status] !== undefined) counts[item.status] += 1; });
    const requestedFilter = String(req.query.status || 'Pending');
    const allowedFilters = ['All', 'Pending', 'Approved', 'Rejected', 'Cancelled'];
    if (!allowedFilters.includes(requestedFilter)) return res.status(400).json({ message: 'Invalid status filter.' });
    const filtered = requestedFilter === 'All' ? allRequests : allRequests.filter(item => item.status === requestedFilter);
    res.json({ counts, requests: filtered.map(shapeManagerRequest) });
  } catch (error) { next(error); }
});

router.patch('/manager/requests/:id/decision', requireRole('manager'), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid leave request.' });
    const decision = String(req.body.decision || '');
    const remarks = typeof req.body.remarks === 'string' ? req.body.remarks.trim() : '';
    if (!['Approved', 'Rejected'].includes(decision)) return res.status(400).json({ message: 'Choose Approve or Reject.' });
    if (remarks.length > 500) return res.status(400).json({ message: 'Manager remarks must be 500 characters or fewer.' });

    const request = await LeaveRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Leave request not found.' });
    if (request.status !== 'Pending') return res.status(409).json({ message: 'Only pending applications can be reviewed.' });
    const employee = await User.findById(request.user);
    if (!employee) return res.status(404).json({ message: 'The employee account for this request could not be found.' });

    let balanceField = null;
    if (decision === 'Approved') {
      balanceField = request.leaveType === 'Casual Leave' ? 'casualLeaveBalance' : 'medicalLeaveBalance';
      if (employee[balanceField] < request.totalDays) {
        return res.status(409).json({ message: `Cannot approve: employee has only ${employee[balanceField]} ${request.leaveType.toLowerCase()} day(s) remaining.` });
      }
      employee[balanceField] -= request.totalDays;
      await employee.save();
    }

    request.status = decision;
    request.managerRemarks = remarks;
    request.reviewedBy = req.userId;
    request.reviewedAt = new Date();
    try {
      await request.save();
    } catch (error) {
      if (decision === 'Approved' && balanceField) {
        employee[balanceField] += request.totalDays;
        await employee.save().catch(() => {});
      }
      throw error;
    }

    const reviewed = await LeaveRequest.findById(request._id).populate('user', 'username email rollNumber casualLeaveBalance medicalLeaveBalance');
    return res.json({ message: `Leave application ${decision.toLowerCase()} successfully.`, request: shapeManagerRequest(reviewed) });
  } catch (error) { next(error); }
});

export default router;
