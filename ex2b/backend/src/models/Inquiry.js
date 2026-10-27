import mongoose from 'mongoose';

const inquirySchema = new mongoose.Schema({
  listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  listingTitle: { type: String, required: true },
  buyerName: { type: String, required: true, trim: true },
  buyerPhone: { type: String, required: true, trim: true },
  buyerLocation: { type: String, required: true, trim: true },
  message: { type: String, trim: true, maxlength: 500, default: '' },
  sellerName: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model('Inquiry', inquirySchema);
