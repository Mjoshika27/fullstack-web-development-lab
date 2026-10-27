import { Router } from 'express';
import MenuItem from '../models/MenuItem.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { category, search, popular } = req.query;
    const filter = { available: true };
    if (category && category !== 'All') filter.category = category;
    if (popular === 'true') filter.isPopular = true;
    if (search?.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { description: { $regex: escaped, $options: 'i' } },
        { category: { $regex: escaped, $options: 'i' } }
      ];
    }
    const items = await MenuItem.find(filter).sort({ isPopular: -1, name: 1 }).lean();
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

export default router;
