import { Router } from 'express';
import mongoose from 'mongoose';
import Listing from '../models/Listing.js';

const router = Router();
const categories = ['Electronics', 'Study Essentials', 'Home & Living', 'Fashion', 'Sports', 'Other'];

function cleanListing(body) {
  return {
    title: String(body.title || '').trim(),
    description: String(body.description || '').trim(),
    category: String(body.category || 'Other'),
    price: Number(body.price),
    originalPrice: body.originalPrice === '' || body.originalPrice == null ? null : Number(body.originalPrice),
    condition: String(body.condition || 'Good'),
    image: String(body.image || '').trim(),
    location: String(body.location || '').trim(),
    sellerName: String(body.sellerName || '').trim(),
    sellerContact: String(body.sellerContact || '').trim(),
    featured: Boolean(body.featured),
    status: String(body.status || 'Available')
  };
}

function validateListing(item) {
  if (item.title.length < 3) return 'Enter a product name with at least 3 characters.';
  if (item.description.length < 10) return 'Description must contain at least 10 characters.';
  if (!categories.includes(item.category)) return 'Choose a valid category.';
  if (!Number.isFinite(item.price) || item.price < 1) return 'Enter a valid price.';
  if (!['Like New', 'Excellent', 'Good', 'Fair'].includes(item.condition)) return 'Choose a valid condition.';
  if (item.location.length < 2) return 'Enter a location.';
  if (item.sellerName.length < 2) return 'Enter the seller name.';
  if (item.sellerContact.length < 5) return 'Enter seller contact information.';
  return '';
}

router.get('/', async (req, res, next) => {
  try {
    const { search = '', category = 'All', maxPrice = '', sort = 'recommended', seller = '' } = req.query;
    const filter = { status: 'Available' };
    if (category && category !== 'All') filter.category = category;
    if (maxPrice && Number.isFinite(Number(maxPrice))) filter.price = { $lte: Number(maxPrice) };
    if (seller) filter.sellerName = new RegExp(`^${String(seller).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    if (search.trim()) {
      const regex = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ title: regex }, { description: regex }, { category: regex }, { location: regex }];
    }
    const sortOrder = sort === 'price-low' ? { price: 1 } : sort === 'price-high' ? { price: -1 } : sort === 'newest' ? { createdAt: -1 } : { featured: -1, createdAt: -1 };
    const listings = await Listing.find(filter).sort(sortOrder).limit(100).lean();
    res.json({ listings });
  } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid listing ID.' });
    const listing = await Listing.findById(req.params.id).lean();
    if (!listing) return res.status(404).json({ message: 'Listing not found.' });
    res.json({ listing });
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const payload = cleanListing(req.body);
    const issue = validateListing(payload);
    if (issue) return res.status(400).json({ message: issue });
    const listing = await Listing.create(payload);
    res.status(201).json({ listing });
  } catch (error) { next(error); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid listing ID.' });
    const existing = await Listing.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Listing not found.' });
    const requestedSeller = String(req.body.sellerName || '').trim();
    if (!requestedSeller || requestedSeller.toLowerCase() !== existing.sellerName.toLowerCase()) {
      return res.status(403).json({ message: 'Only the listing owner can edit this item in the lab demo.' });
    }
    const payload = cleanListing({ ...req.body, sellerName: existing.sellerName });
    const issue = validateListing(payload);
    if (issue) return res.status(400).json({ message: issue });
    Object.assign(existing, payload);
    await existing.save();
    res.json({ listing: existing });
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid listing ID.' });
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found.' });
    const requestedSeller = String(req.body.sellerName || req.query.sellerName || '').trim();
    if (!requestedSeller || requestedSeller.toLowerCase() !== listing.sellerName.toLowerCase()) {
      return res.status(403).json({ message: 'Only the listing owner can remove this item in the lab demo.' });
    }
    await listing.deleteOne();
    res.json({ message: 'Listing removed.' });
  } catch (error) { next(error); }
});

export default router;
