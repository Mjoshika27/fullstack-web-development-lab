import 'dotenv/config';
import mongoose from 'mongoose';
import MenuItem from './models/MenuItem.js';
import { menuSeed } from './data/menu.js';

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/spice_garden';

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  const operations = menuSeed.map((item) => ({
    updateOne: { filter: { slug: item.slug }, update: { $set: item }, upsert: true }
  }));
  await MenuItem.bulkWrite(operations);
  console.log(`Menu ready: ${menuSeed.length} items inserted or updated.`);
} catch (error) {
  console.error('Could not seed the menu. Check that MongoDB is running and MONGO_URI is correct.');
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect().catch(() => {});
}
