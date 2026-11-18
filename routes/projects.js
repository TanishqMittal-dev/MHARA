const express = require('express');
const mongoose = require('mongoose');
const Project = require('../models/Project');
const Enquiry = require('../models/Enquiry');
const Visit = require('../models/Visit');
const Feedback = require('../models/Feedback');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();
const allowed = ['title', 'category', 'location', 'image', 'price', 'description', 'detailsUrl', 'featured'];
const validateProject = body => {
  const errors = [];
  if (typeof body.title !== 'string' || body.title.trim().length < 2 || body.title.trim().length > 160) errors.push('Title must be between 2 and 160 characters.');
  if (!Array.isArray(body.category) || !body.category.length || body.category.some(item => typeof item !== 'string' || !item.trim() || item.length > 40)) errors.push('Provide at least one valid category.');
  if (typeof body.location !== 'string' || !body.location.trim() || body.location.length > 160) errors.push('Provide a project location.');
  if (typeof body.image !== 'string' || !body.image.trim() || body.image.length > 500) errors.push('Provide an image path or URL.');
  if (body.featured !== undefined && typeof body.featured !== 'boolean') errors.push('Featured must be true or false.');
  return errors;
};
router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
    const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
    if (category && category.toLowerCase() !== 'all') filter.category = new RegExp(`^${category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    if (search) {
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [{ title: new RegExp(safe, 'i') }, { location: new RegExp(safe, 'i') }, { description: new RegExp(safe, 'i') }];
    }
    const projects = await Project.find(filter).sort({ featured: -1, createdAt: -1 }).lean();
    res.json({ success: true, count: projects.length, data: projects });
  } catch (error) { next(error); }
});
router.get('/:id', async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid project ID.' });
  try {
    const data = await Project.findById(req.params.id).lean();
    if (!data) return res.status(404).json({ success: false, error: 'Project not found.' });
    res.json({ success: true, data });
  } catch (error) { next(error); }
});
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const errors = validateProject(req.body || {});
    if (errors.length) return res.status(400).json({ success: false, errors });
    const data = await Project.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});
router.patch('/:id', requireAdmin, async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid project ID.' });
  try {
    const input = Object.fromEntries(Object.entries(req.body || {}).filter(([key]) => allowed.includes(key)));
    if (!Object.keys(input).length) return res.status(400).json({ success: false, error: 'Provide project fields to update.' });
    const existing = await Project.findById(req.params.id).lean();
    if (!existing) return res.status(404).json({ success: false, error: 'Project not found.' });
    const errors = validateProject({ ...existing, ...input });
    if (errors.length) return res.status(400).json({ success: false, errors });
    const data = await Project.findByIdAndUpdate(req.params.id, input, { new: true, runValidators: true });
    res.json({ success: true, data });
  } catch (error) { next(error); }
});
router.delete('/:id', requireAdmin, async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid project ID.' });
  try {
    const data = await Project.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ success: false, error: 'Project not found.' });
    await Promise.all([
      Enquiry.updateMany({ projectId: data._id }, { $set: { projectId: null } }),
      Visit.updateMany({ projectId: data._id }, { $set: { projectId: null } }),
      Feedback.updateMany({ projectId: data._id }, { $set: { projectId: null } })
    ]);
    res.json({ success: true, message: 'Project deleted.' });
  } catch (error) { next(error); }
});
module.exports = router;
