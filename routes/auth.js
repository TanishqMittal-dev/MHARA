const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { issueSession, requireAuth, requireAdmin } = require('../middleware/auth');
const rateLimit = require('../middleware/rate-limit');
const router = express.Router();
const validEmail = value => typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
const publicUser = user => ({ id: user._id, fullName: user.fullName, email: user.email, phone: user.phone, role: user.role });

router.post('/signup', rateLimit({ windowMs: 60 * 60 * 1000, max: 10 }), async (req, res, next) => {
  try {
    const { fullName, email, phone, password } = req.body || {};
    const name = typeof fullName === 'string' ? fullName.trim() : '';
    const mail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const tel = typeof phone === 'string' ? phone.trim() : '';
    if (name.length < 2 || name.length > 100) return res.status(400).json({ success: false, error: 'Name must be between 2 and 100 characters.' });
    if (!validEmail(mail) || mail.length > 254) return res.status(400).json({ success: false, error: 'Please provide a valid email address.' });
    if (tel.replace(/\D/g, '').length < 10 || tel.length > 30) return res.status(400).json({ success: false, error: 'Please provide a valid phone number.' });
    if (typeof password !== 'string' || password.length < 8 || password.length > 128) return res.status(400).json({ success: false, error: 'Password must be between 8 and 128 characters.' });
    const user = new User({ fullName: name, email: mail, phone: tel, password });
    await user.save();
    res.status(201).json({ success: true, message: 'Account created successfully.', user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, error: 'An account with this email address already exists.' });
    if (error.name === 'ValidationError') return res.status(400).json({ success: false, error: Object.values(error.errors).map(item => item.message).join(' ') });
    next(error);
  }
});

router.post('/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }), async (req, res, next) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!validEmail(email) || !password || password.length > 128) return res.status(400).json({ success: false, error: 'Enter a valid email and password.' });
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    issueSession(res, user, req.body?.remember === true);
    res.json({ success: true, message: 'Login successful.', user: publicUser(user) });
  } catch (error) { next(error); }
});

router.get('/me', requireAuth, (req, res) => res.json({ success: true, user: publicUser(req.user) }));
router.post('/logout', (req, res) => {
  res.clearCookie('mhara_session', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' });
  res.clearCookie('mhara_user');
  res.json({ success: true, message: 'Logged out.' });
});

router.get('/users', requireAdmin, async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 25));
    const [data, total] = await Promise.all([User.find().select('-password').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), User.countDocuments()]);
    res.json({ success: true, data, page, limit, total });
  } catch (error) { next(error); }
});
router.patch('/users/:id', requireAdmin, async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid user ID.' });
  try {
    const update = {};
    if (typeof req.body?.fullName === 'string') update.fullName = req.body.fullName.trim();
    if (typeof req.body?.phone === 'string') update.phone = req.body.phone.trim();
    if (!Object.keys(update).length) return res.status(400).json({ success: false, error: 'Provide a name or phone number to update.' });
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });
    res.json({ success: true, user });
  } catch (error) { next(error); }
});
router.delete('/users/:id', requireAdmin, async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid user ID.' });
  if (String(req.user._id) === req.params.id) return res.status(400).json({ success: false, error: 'You cannot delete your own account while signed in.' });
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });
    res.json({ success: true, message: 'User deleted.' });
  } catch (error) { next(error); }
});
module.exports = router;






