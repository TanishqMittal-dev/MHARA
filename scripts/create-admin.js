require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
async function createAdmin() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, ADMIN_PHONE } = process.env;
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not configured.');
  if (!ADMIN_EMAIL || !/^\S+@\S+\.\S+$/.test(ADMIN_EMAIL)) throw new Error('Set ADMIN_EMAIL to a valid email address.');
  if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12) throw new Error('Set ADMIN_PASSWORD to at least 12 characters.');
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  let user = await User.findOne({ email: ADMIN_EMAIL.trim().toLowerCase() });
  if (!user) {
    if (!ADMIN_NAME || !ADMIN_PHONE) throw new Error('For a new admin, also set ADMIN_NAME and ADMIN_PHONE.');
    user = new User({ fullName: ADMIN_NAME, email: ADMIN_EMAIL, phone: ADMIN_PHONE, password: ADMIN_PASSWORD, role: 'admin' });
  } else {
    user.role = 'admin';
    user.password = ADMIN_PASSWORD;
  }
  await user.save();
  console.log(`Administrator account ready for ${user.email}. Password not displayed.`);
  await mongoose.disconnect();
}
createAdmin().catch(error => { console.error('Admin provisioning failed:', error.message); mongoose.disconnect().finally(() => process.exit(1)); });
