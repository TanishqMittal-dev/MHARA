const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: [true, 'Please provide your full name'], trim: true, minlength: 2, maxlength: 100 },
  email: { type: String, required: [true, 'Please provide an email address'], unique: true, lowercase: true, trim: true, maxlength: 254, match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'] },
  phone: { type: String, required: [true, 'Please provide your phone number'], trim: true, maxlength: 30 },
  password: { type: String, required: [true, 'Please provide a password'], minlength: [8, 'Password must be at least 8 characters'] },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
}, { timestamps: true });
UserSchema.pre('save', async function () {
  if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 12);
});
UserSchema.methods.matchPassword = function (enteredPassword) { return bcrypt.compare(enteredPassword, this.password); };
module.exports = mongoose.model('User', UserSchema);
