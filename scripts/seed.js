require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('../models/Project');
const projects = [
  { title: 'Green Valley', category: ['townships', 'villas', 'upcoming'], location: 'Jaipur', image: 'images/project-green-valley.jpg', price: 'Starting from ₹1.25 Cr', description: 'A tranquil gated sanctuary combining contemporary architectural villas with landscaped green corridors.', detailsUrl: 'project-detailss.html', featured: true },
  { title: 'ABC Heights', category: ['apartments'], location: 'Jaipur', image: 'images/project-abc-heights.jpg', price: 'Starting from ₹85 Lakhs', description: 'High-rise residences with city views, premium penthouses, and club amenities.', detailsUrl: 'project-detailss.html', featured: true },
  { title: 'Palm Villas', category: ['villas', 'apartments'], location: 'Dudu', image: 'images/project-palm-villas.jpg', price: 'Starting from ₹1.10 Cr', description: 'Private courtyard villas inspired by Mediterranean architecture and open-sky living.', detailsUrl: 'project-detailss.html', featured: true },
  { title: 'Business Park', category: ['commercial'], location: 'Jaipur', image: 'images/project-business-park.jpg', price: 'Starting from ₹2.50 Cr', description: 'Commercial workspaces and corporate offices with sustainable design.', detailsUrl: 'project-detailss.html', featured: false },
  { title: 'ABC Resort', category: ['resorts', 'apartments'], location: 'Jaipur', image: 'images/project-abc-resort.jpg', price: 'Starting from ₹1.80 Cr', description: 'Resort-style residences with clubhouses, wellness facilities, and pools.', detailsUrl: 'project-detailss.html', featured: false },
  { title: 'Sunrise Plots', category: ['upcoming', 'townships'], location: 'Dudu', image: 'images/project-sunrise-plots.jpg', price: 'Starting from ₹45 Lakhs', description: 'Residential plots within an integrated master-planned community.', detailsUrl: 'project-detailss.html', featured: false }
];
async function seed() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not configured.');
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  const count = await Project.countDocuments();
  if (!count) { await Project.insertMany(projects); console.log(`Seeded ${projects.length} initial projects.`); }
  else console.log(`Kept all existing data; ${count} projects already exist.`);
  await mongoose.disconnect();
}
seed().catch(error => { console.error('Seeding failed:', error.message); mongoose.disconnect().finally(() => process.exit(1)); });
