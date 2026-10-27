import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 90 },
  description: { type: String, required: true, trim: true, maxlength: 1200 },
  category: { type: String, required: true, enum: ['Electronics', 'Study Essentials', 'Home & Living', 'Fashion', 'Sports', 'Other'] },
  price: { type: Number, required: true, min: 1 },
  originalPrice: { type: Number, min: 0, default: null },
  condition: { type: String, required: true, enum: ['Like New', 'Excellent', 'Good', 'Fair'] },
  image: { type: String, default: '' },
  location: { type: String, required: true, trim: true, maxlength: 100 },
  sellerName: { type: String, required: true, trim: true, maxlength: 60 },
  sellerContact: { type: String, required: true, trim: true, maxlength: 120 },
  featured: { type: Boolean, default: false },
  status: { type: String, enum: ['Available', 'Reserved', 'Sold'], default: 'Available' }
}, { timestamps: true });

export default mongoose.model('Listing', listingSchema);
