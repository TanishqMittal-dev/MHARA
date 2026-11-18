const express = require('express');
const mongoose = require('mongoose');
const Visit = require('../models/Visit');
const Project = require('../models/Project');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();
router.post('/', async (req, res, next) => {
  try {
    const { name, phone, project, visitDate, projectId } = req.body || {};
    const cleanName = typeof name === 'string' ? name.trim() : '';
    const cleanPhone = typeof phone === 'string' ? phone.trim() : '';
    const cleanProject = typeof project === 'string' ? project.trim() : '';
    const date = typeof visitDate === 'string' ? new Date(visitDate) : new Date(NaN);
    if (cleanName.length < 2 || cleanName.length > 100) return res.status(400).json({ success: false, error: 'Name must be between 2 and 100 characters.' });
    if (cleanPhone.replace(/\D/g, '').length < 10 || cleanPhone.length > 30) return res.status(400).json({ success: false, error: 'Enter a valid phone number.' });
    if (!cleanProject || cleanProject.length > 160) return res.status(400).json({ success: false, error: 'Choose a project.' });
    if (Number.isNaN(date.getTime()) || date <= new Date()) return res.status(400).json({ success: false, error: 'Choose a valid future visit date.' });
    if (projectId && !mongoose.isValidObjectId(projectId)) return res.status(400).json({ success: false, error: 'Invalid project ID.' });
    let linkedProjectId;
    if (projectId) {
      const linkedProject = await Project.findById(projectId).select('_id');
      if (!linkedProject) return res.status(400).json({ success: false, error: 'Selected project was not found.' });
      linkedProjectId = linkedProject._id;
    }
    const data = await Visit.create({ name: cleanName, phone: cleanPhone, project: cleanProject, visitDate: date, ...(linkedProjectId ? { projectId: linkedProjectId } : {}) });
    res.status(201).json({ success: true, message: 'Your site visit has been scheduled.', data: { id: data._id, visitDate: data.visitDate } });
  } catch (error) { next(error); }
});
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 25));
    const [data, total] = await Promise.all([Visit.find().sort({ visitDate: 1 }).skip((page - 1) * limit).limit(limit).populate('projectId', 'title location').lean(), Visit.countDocuments()]);
    res.json({ success: true, data, page, limit, total });
  } catch (error) { next(error); }
});
router.patch('/:id/status', requireAdmin, async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid visit ID.' });
  try {
    if (!['Scheduled', 'Completed', 'Cancelled'].includes(req.body?.status)) return res.status(400).json({ success: false, error: 'Invalid visit status.' });
    const data = await Visit.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true });
    if (!data) return res.status(404).json({ success: false, error: 'Visit not found.' });
    res.json({ success: true, data });
  } catch (error) { next(error); }
});
router.delete('/:id', requireAdmin, async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid visit ID.' });
  try {
    const data = await Visit.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ success: false, error: 'Visit not found.' });
    res.json({ success: true, message: 'Visit deleted.' });
  } catch (error) { next(error); }
});
module.exports = router;
