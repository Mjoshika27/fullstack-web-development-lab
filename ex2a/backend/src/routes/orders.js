import { Router } from 'express';
import MenuItem from '../models/MenuItem.js';
import Order from '../models/Order.js';

const router = Router();
const validPayments = new Set(['Cash on Delivery', 'UPI on Delivery']);

router.post('/', async (req, res, next) => {
  try {
    const { customer, items, paymentMethod = 'Cash on Delivery', notes = '' } = req.body ?? {};
    const name = String(customer?.name ?? '').trim();
    const phone = String(customer?.phone ?? '').replace(/[\s()-]/g, '');
    const address = String(customer?.address ?? '').trim();

    if (name.length < 2) return res.status(400).json({ message: 'Please enter your full name.' });
    if (!/^\+?\d{10,13}$/.test(phone)) return res.status(400).json({ message: 'Enter a valid phone number (10–13 digits).' });
    if (address.length < 8) return res.status(400).json({ message: 'Please enter a complete delivery address.' });
    if (!validPayments.has(paymentMethod)) return res.status(400).json({ message: 'Select a valid payment method.' });
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: 'Your cart is empty.' });
    if (items.length > 30) return res.status(400).json({ message: 'Too many different items in one order.' });

    const requested = new Map();
    for (const item of items) {
      const slug = String(item?.slug ?? '').trim();
      const quantity = Number(item?.quantity);
      if (!slug || !Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
        return res.status(400).json({ message: 'One of the cart items has an invalid quantity.' });
      }
      requested.set(slug, (requested.get(slug) ?? 0) + quantity);
    }

    const menuItems = await MenuItem.find({ slug: { $in: [...requested.keys()] }, available: true }).lean();
    if (menuItems.length !== requested.size) {
      return res.status(400).json({ message: 'A cart item is no longer available. Please refresh the menu.' });
    }

    const orderItems = menuItems.map((item) => ({
      slug: item.slug,
      name: item.name,
      price: item.price,
      quantity: requested.get(item.slug),
      image: item.image
    }));
    const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryFee = subtotal >= 499 ? 0 : 25;
    const total = subtotal + deliveryFee;
    const orderNumber = `SG${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 90 + 10)}`;

    const order = await Order.create({
      orderNumber,
      customer: { name, phone, address },
      paymentMethod,
      notes: String(notes).trim().slice(0, 300),
      items: orderItems,
      subtotal,
      deliveryFee,
      total
    });

    res.status(201).json({ message: 'Order placed successfully.', order });
  } catch (error) {
    next(error);
  }
});

router.get('/:orderNumber', async (req, res, next) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber }).lean();
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    res.json({ order });
  } catch (error) {
    next(error);
  }
});

export default router;
