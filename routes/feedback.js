const express = require('express');
const mongoose = require('mongoose');
const Feedback = require('../models/Feedback');
const Project = require('../models/Project');
const { requireAdmin } = require('../middleware/auth');
const rateLimit = require('../middleware/rate-limit');
const router = express.Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
router.post('/', rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }), async (req, res, next) => {
  try {
    const { name, email, rating, project = '', projectId, message } = req.body || {};
    const cleanName = typeof name === 'string' ? name.trim() : '';
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const cleanProject = typeof project === 'string' ? project.trim() : null;
    const cleanMessage = typeof message === 'string' ? message.trim() : '';
    const numericRating = Number(rating);
    const errors = {};
    if (cleanName.length < 2 || cleanName.length > 100) errors.name = 'Enter a name between 2 and 100 characters.';
    if (!emailPattern.test(cleanEmail) || cleanEmail.length > 254) errors.email = 'Enter a valid email address.';
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) errors.rating = 'Choose a rating from 1 to 5.';
    if (cleanProject === null || cleanProject.length > 120) errors.project = 'Project must be 120 characters or fewer.';
    if (cleanMessage.length < 10 || cleanMessage.length > 2000) errors.message = 'Feedback must be between 10 and 2000 characters.';
    if (projectId && !mongoose.isValidObjectId(projectId)) errors.project = 'Invalid project selection.';
    if (Object.keys(errors).length) return res.status(400).json({ success: false, error: 'Please correct the highlighted fields.', fields: errors });
    if (projectId && !(await Project.exists({ _id: projectId }))) return res.status(400).json({ success: false, error: 'Selected project was not found.' });
    const feedback = await Feedback.create({ name: cleanName, email: cleanEmail, rating: numericRating, project: cleanProject, projectId: projectId || null, message: cleanMessage });
    res.status(201).json({ success: true, message: 'Thank you. Your feedback has been received.', data: { id: feedback._id, createdAt: feedback.createdAt } });
  } catch (error) { next(error); }
});
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 25));
    const [data, total] = await Promise.all([Feedback.find().populate('projectId', 'title location').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), Feedback.countDocuments()]);
    res.json({ success: true, data, page, limit, total });
  } catch (error) { next(error); }
});
router.patch('/:id/status', requireAdmin, async (req, res, next) => {
  try {
    if (!['New', 'Reviewed', 'Archived'].includes(req.body?.status)) return res.status(400).json({ success: false, error: 'Invalid feedback status.' });
    const data = await Feedback.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true });
    if (!data) return res.status(404).json({ success: false, error: 'Feedback not found.' });
    res.json({ success: true, data });
  } catch (error) { next(error); }
});
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const deleted = await Feedback.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, error: 'Feedback not found.' });
    res.json({ success: true, message: 'Feedback deleted.' });
  } catch (error) { next(error); }
});
module.exports = router;

