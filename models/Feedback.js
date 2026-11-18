const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  rating: { type: Number, required: true, min: 1, max: 5, validate: Number.isInteger },
  project: { type: String, trim: true, maxlength: 120, default: '' },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  message: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
  status: { type: String, enum: ['New', 'Reviewed', 'Archived'], default: 'New' }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', FeedbackSchema);

