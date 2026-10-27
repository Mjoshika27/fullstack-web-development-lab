import { Router } from 'express';
import mongoose from 'mongoose';
import Listing from '../models/Listing.js';
import Inquiry from '../models/Inquiry.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const listingId = String(req.body.listingId || '');
    if (!mongoose.isValidObjectId(listingId)) return res.status(400).json({ message: 'This demo listing is not connected to the database yet. Please restart in live mode or send the seller an enquiry in demo mode.' });
    const listing = await Listing.findById(listingId);
    if (!listing || listing.status !== 'Available') return res.status(404).json({ message: 'This listing is no longer available.' });
    const buyerName = String(req.body.buyerName || '').trim();
    const buyerPhone = String(req.body.buyerPhone || '').trim();
    const buyerLocation = String(req.body.buyerLocation || '').trim();
    const message = String(req.body.message || '').trim();
    if (buyerName.length < 2) return res.status(400).json({ message: 'Enter your name.' });
    if (!/^\+?[0-9\s()-]{10,18}$/.test(buyerPhone)) return res.status(400).json({ message: 'Enter a valid phone number.' });
    if (buyerLocation.length < 2) return res.status(400).json({ message: 'Enter your location.' });
    const inquiry = await Inquiry.create({ listingId: listing._id, listingTitle: listing.title, buyerName, buyerPhone, buyerLocation, message, sellerName: listing.sellerName });
    res.status(201).json({ inquiry: { id: inquiry._id, listingTitle: inquiry.listingTitle, sellerName: inquiry.sellerName, createdAt: inquiry.createdAt } });
  } catch (error) { next(error); }
});

router.get('/', async (req, res, next) => {
  try {
    const sellerName = String(req.query.sellerName || '').trim();
    if (!sellerName) return res.status(400).json({ message: 'Seller name is required.' });
    const inquiries = await Inquiry.find({ sellerName: new RegExp(`^${sellerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }).sort({ createdAt: -1 }).limit(100).lean();
    res.json({ inquiries });
  } catch (error) { next(error); }
});

export default router;
