const mongoose = require('mongoose');
const ProjectSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Please provide project title'], trim: true, minlength: 2, maxlength: 160 },
  category: { type: [{ type: String, trim: true, maxlength: 40 }], required: true, validate: { validator: values => values.length > 0, message: 'At least one project category is required.' } },
  location: { type: String, required: [true, 'Please provide project location'], trim: true, maxlength: 160 },
  image: { type: String, required: true, trim: true, maxlength: 500 },
  price: { type: String, trim: true, maxlength: 100, default: '' },
  description: { type: String, trim: true, maxlength: 3000, default: '' },
  detailsUrl: { type: String, default: 'project-detailss.html', trim: true },
  featured: { type: Boolean, default: false }
}, { timestamps: true });
module.exports = mongoose.model('Project', ProjectSchema);
