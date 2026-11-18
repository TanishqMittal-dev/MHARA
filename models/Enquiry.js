const mongoose = require('mongoose');

const EnquirySchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Please provide your full name'], trim: true, minlength: 2, maxlength: 100 },
  phone: { type: String, required: [true, 'Please provide your phone number'], trim: true, maxlength: 30 },
  email: { type: String, required: [true, 'Please provide your email address'], lowercase: true, trim: true, maxlength: 254, match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'] },
  project: { type: String, required: [true, 'Please select a project of interest'], trim: true, maxlength: 160 },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  message: { type: String, trim: true, maxlength: 2000, default: '' },
  status: { type: String, enum: ['New', 'Contacted', 'In Progress', 'Resolved'], default: 'New' }
}, { timestamps: true });
module.exports = mongoose.model('Enquiry', EnquirySchema);
