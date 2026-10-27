require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Post = require('./models/Post');

const usersData = [
  { name: 'Kamali', username: 'kamali', email: 'kamali@demo.com', bio: 'Learning, creating, and sharing along the way.' },
  { name: 'Arun', username: 'arun', email: 'arun@demo.com', bio: 'Learning JavaScript and building things.' },
  { name: 'Priya', username: 'priya', email: 'priya@demo.com', bio: 'UI/UX, good design, and tiny details.' },
  { name: 'Rahul', username: 'rahul', email: 'rahul@demo.com', bio: 'Curious mind. Developer in progress.' },
  { name: 'Divya', username: 'divya', email: 'divya@demo.com', bio: 'Sharing what I learn every day.' },
  { name: 'Kevin', username: 'kevin', email: 'kevin@demo.com', bio: 'Building projects one feature at a time.' }
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/miniblog');
  const passwordHash = await bcrypt.hash('demo12345', 12);
  const users = {};

  for (const item of usersData) {
    users[item.username] = await User.findOneAndUpdate(
      { username: item.username },
      { $setOnInsert: { ...item, passwordHash, followers: [], following: [], postsCount: 0 } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  await User.updateOne({ _id: users.kamali._id }, { $addToSet: { following: { $each: [users.arun._id, users.priya._id] } } });
  await User.updateOne({ _id: users.arun._id }, { $addToSet: { followers: users.kamali._id } });
  await User.updateOne({ _id: users.priya._id }, { $addToSet: { followers: users.kamali._id } });

  const samplePosts = [
    { author: users.arun._id, content: 'Just finished learning JavaScript basics! 🚀 Excited to build more projects.' },
    { author: users.priya._id, content: 'Working on a new UI/UX design today. Good design makes technology easier for everyone! ✨' },
    { author: users.rahul._id, content: 'Small progress is still progress. Today I finally understood how React state updates work. 💙' },
    { author: users.divya._id, content: 'A reminder to document what you learn. Your future self will thank you. 🌱' },
    { author: users.kevin._id, content: 'Building a little something this week. One feature at a time, one bug at a time.' }
  ];

  for (const item of samplePosts) {
    await Post.updateOne(
      { author: item.author, content: item.content },
      { $setOnInsert: { ...item, likes: [], comments: [] } },
      { upsert: true }
    );
  }

  for (const user of Object.values(users)) {
    const postsCount = await Post.countDocuments({ author: user._id });
    await User.updateOne({ _id: user._id }, { $set: { postsCount } });
  }

  console.log('MiniBlog demo data is ready.');
  console.log('Demo login: kamali@demo.com  |  Password: demo12345');
  console.log('Other demo users: arun@demo.com, priya@demo.com, rahul@demo.com, divya@demo.com, kevin@demo.com');
  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
