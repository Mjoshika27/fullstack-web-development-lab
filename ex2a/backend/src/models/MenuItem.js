import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { type: String, required: true, index: true },
  price: { type: Number, required: true, min: 0 },
  rating: { type: Number, default: 4.5, min: 0, max: 5 },
  isPopular: { type: Boolean, default: false },
  isVeg: { type: Boolean, default: true },
  prepTime: { type: String, default: '15–20 min' },
  image: { type: String, default: '' },
  available: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('MenuItem', menuItemSchema);
