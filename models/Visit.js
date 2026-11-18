const mongoose = require('mongoose');
const VisitSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Please provide your full name'], trim: true, minlength: 2, maxlength: 100 },
  phone: { type: String, required: [true, 'Please provide your phone number'], trim: true, maxlength: 30 },
  project: { type: String, required: [true, 'Please select a development project'], trim: true, maxlength: 160 },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  visitDate: { type: Date, required: [true, 'Please specify your preferred visit date'], validate: { validator: value => value > new Date(), message: 'Visit date must be in the future.' } },
  status: { type: String, enum: ['Scheduled', 'Completed', 'Cancelled'], default: 'Scheduled' }
}, { timestamps: true });
module.exports = mongoose.model('Visit', VisitSchema);
