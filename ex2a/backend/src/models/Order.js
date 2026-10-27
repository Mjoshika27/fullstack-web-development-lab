import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  slug: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String, default: '' }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true, index: true },
  customer: {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true }
  },
  paymentMethod: { type: String, enum: ['Cash on Delivery', 'UPI on Delivery'], default: 'Cash on Delivery' },
  notes: { type: String, default: '', maxlength: 300 },
  items: { type: [orderItemSchema], required: true },
  subtotal: { type: Number, required: true, min: 0 },
  deliveryFee: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['Order placed', 'Preparing', 'Out for delivery', 'Delivered', 'Cancelled'], default: 'Order placed' }
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);
