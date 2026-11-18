require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const enquiryRoutes = require('./routes/enquiries');
const visitRoutes = require('./routes/visits');
const projectRoutes = require('./routes/projects');
const feedbackRoutes = require('./routes/feedback');

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: false, limit: '20kb' }));
app.use(cookieParser());
app.use((req, res, next) => {
  if (/^\/(?:server\.js|package(?:-lock)?\.json|README\.md|\.env(?:\.example)?|\.gitignore|config|models|routes|middleware|scripts|node_modules)(?:\/|$)/i.test(req.path)) return res.status(404).end();
  next();
});
app.use(express.static(path.join(__dirname), { dotfiles: 'deny', index: false }));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/project-details.html', (req, res) => res.sendFile(path.join(__dirname, 'project-detailss.html')));
app.use('/api/auth', authRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/feedback', feedbackRoutes);
app.get('/api/health', async (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  const isConnected = dbState === 1;
  let collections = [];
  if (isConnected && mongoose.connection.db) {
    try { collections = (await mongoose.connection.db.listCollections().toArray()).map(collection => collection.name); }
    catch (error) { /* collection listing can be denied by database permissions */ }
  }
  res.status(isConnected ? 200 : 503).json({
    success: isConnected,
    status: isConnected ? 'UP' : 'DEGRADED',
    server: 'MHARA Real Estate Backend Server',
    database: states[dbState] || 'unknown',
    databaseName: mongoose.connection.name || null,
    host: mongoose.connection.host || null,
    collections,
    uptime: `${Math.floor(process.uptime())} seconds`,
    timestamp: new Date().toISOString()
  });
});app.use('/api', (req, res) => res.status(404).json({ success: false, error: 'API endpoint not found.' }));
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Internal server error.';
  if (err.type === 'entity.parse.failed') { status = 400; message = 'Request body contains invalid JSON.'; }
  if (err.name === 'ValidationError') { status = 400; message = Object.values(err.errors).map(item => item.message).join(' '); }
  if (err.name === 'CastError') { status = 400; message = 'Invalid record identifier or field value.'; }
  if (err.code === 11000) { status = 409; message = 'A record with that value already exists.'; }
  if (status >= 500) console.error('Server Error:', err.message);
  res.status(status).json({ success: false, error: process.env.NODE_ENV === 'production' && status >= 500 ? 'Internal server error.' : message });
});

const PORT = Number.parseInt(process.env.PORT, 10) || 5000;
// Global Process Error Handlers to prevent abrupt crash on transient issues
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception caught:', err.message);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection caught:', reason);
});

const startServer = async () => {
  await connectDB();
  const server = app.listen(PORT, () => console.log(`MHARA server listening on port ${PORT}`));
  server.on('error', error => { console.error('HTTP server error:', error.message); process.exitCode = 1; });
  const shutdown = () => server.close(async () => { await mongoose.connection.close(); process.exit(0); });
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
  return server;
};
if (require.main === module) startServer().catch(error => { console.error('Fatal startup error:', error.message); process.exit(1); });
module.exports = { app, startServer };




