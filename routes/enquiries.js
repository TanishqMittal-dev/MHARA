const express = require('express');
const mongoose = require('mongoose');
const Enquiry = require('../models/Enquiry');
const Project = require('../models/Project');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/', async (req, res, next) => {
  try {
    const { name, phone, email, project, message = '', projectId } = req.body || {};
    const values = { name: typeof name === 'string' ? name.trim() : '', phone: typeof phone === 'string' ? phone.trim() : '', email: typeof email === 'string' ? email.trim().toLowerCase() : '', project: typeof project === 'string' ? project.trim() : '', message: typeof message === 'string' ? message.trim() : null };
    const errors = [];
    if (values.name.length < 2 || values.name.length > 100) errors.push('Name must be between 2 and 100 characters.');
    if (values.phone.replace(/\D/g, '').length < 10 || values.phone.length > 30) errors.push('Enter a valid phone number.');
    if (!emailPattern.test(values.email) || values.email.length > 254) errors.push('Enter a valid email address.');
    if (!values.project || values.project.length > 160) errors.push('Choose a project.');
    if (values.message === null || values.message.length > 2000) errors.push('Message must be 2000 characters or fewer.');
    if (errors.length) return res.status(400).json({ success: false, errors });
    if (projectId && !mongoose.isValidObjectId(projectId)) return res.status(400).json({ success: false, error: 'Invalid project ID.' });
    let linkedProjectId;
    if (projectId) {
      const linkedProject = await Project.findById(projectId).select('_id');
      if (!linkedProject) return res.status(400).json({ success: false, error: 'Selected project was not found.' });
      linkedProjectId = linkedProject._id;
    }
    const data = await Enquiry.create({ ...values, ...(linkedProjectId ? { projectId: linkedProjectId } : {}) });
    res.status(201).json({ success: true, message: 'Thank you. Your enquiry has been received.', data: { id: data._id, createdAt: data.createdAt } });
  } catch (error) { next(error); }
});
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 25));
    const [data, total] = await Promise.all([Enquiry.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('projectId', 'title location').lean(), Enquiry.countDocuments()]);
    res.json({ success: true, data, page, limit, total });
  } catch (error) { next(error); }
});
router.patch('/:id/status', requireAdmin, async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid enquiry ID.' });
  try {
    if (!['New', 'Contacted', 'In Progress', 'Resolved'].includes(req.body?.status)) return res.status(400).json({ success: false, error: 'Invalid enquiry status.' });
    const data = await Enquiry.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true });
    if (!data) return res.status(404).json({ success: false, error: 'Enquiry not found.' });
    res.json({ success: true, data });
  } catch (error) { next(error); }
});
router.delete('/:id', requireAdmin, async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid enquiry ID.' });
  try {
    const data = await Enquiry.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ success: false, error: 'Enquiry not found.' });
    res.json({ success: true, message: 'Enquiry deleted.' });
  } catch (error) { next(error); }
});
module.exports = router;
