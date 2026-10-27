import 'dotenv/config';
import mongoose from 'mongoose';
import Listing from './models/Listing.js';
import { listingSeed } from './data/listings.js';

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/reloop_market';

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  const count = await Listing.countDocuments();
  if (count === 0) {
    await Listing.insertMany(listingSeed.map(({ seedKey, ...item }) => item));
    console.log(`Marketplace ready: ${listingSeed.length} sample listings inserted.`);
  } else {
    console.log(`Marketplace already has ${count} listings; seed data was not duplicated.`);
  }
} catch (error) {
  console.error('Could not seed listings. Check that MongoDB is running and MONGO_URI is correct.');
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect().catch(() => {});
}
