require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { app } = require('../server');
const User = require('../models/User');
const Enquiry = require('../models/Enquiry');
const Visit = require('../models/Visit');
const Feedback = require('../models/Feedback');
const Project = require('../models/Project');

const created = { users: [], enquiries: [], visits: [], feedback: [], projects: [] };
const assert = (condition, message) => { if (!condition) throw new Error(message); };
async function main() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required for integration tests.');
  await connectDB();
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const req = async (path, options = {}, cookie = '') => fetch(`${base}${path}`, { ...options, headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...(options.headers || {}) } });
  const json = async response => response.json();
  try {
    let response = await req('/api/health'); let data = await json(response); assert(response.status === 200 && data.database === 'connected', 'health/db check failed'); console.log('PASS health and MongoDB');
    response = await req('/api/projects'); data = await json(response); assert(response.ok && data.count > 0, 'project listing failed'); console.log('PASS public project catalogue');
    const firstProject = data.data[0];
    response = await req(`/api/projects/${firstProject._id}`); data = await json(response); assert(response.ok && data.data._id === firstProject._id, 'project detail failed');
    response = await req('/api/projects?category=apartments'); data = await json(response); assert(response.ok && data.data.every(item => item.category.includes('apartments')), 'category filtering failed'); console.log('PASS project detail and category filter');
    response = await req('/api/enquiries'); assert(response.status === 401, 'enquiry list must require admin');
    response = await req('/api/visits'); assert(response.status === 401, 'visit list must require admin');
    response = await req('/api/feedback'); assert(response.status === 401, 'feedback list must require admin'); console.log('PASS admin record routes reject anonymous access');

    response = await req('/api/feedback', { method: 'POST', body: JSON.stringify({ name: 'Smoke Test', email: `smoke-${unique}@example.test`, rating: 6, message: 'invalid rating test message' }) });
    assert(response.status === 400, 'invalid feedback should be rejected');
    response = await req('/api/feedback', { method: 'POST', body: JSON.stringify({ name: 'Smoke Test', email: `smoke-${unique}@example.test`, rating: 5, project: firstProject.title, projectId: firstProject._id, message: 'Integration feedback record for cleanup.' }) });
    data = await json(response); assert(response.status === 201 && data.success, 'feedback submission failed'); created.feedback.push(data.data.id); console.log('PASS feedback validation, submission, and MongoDB persistence');

    response = await req('/api/enquiries', { method: 'POST', body: JSON.stringify({ name: 'Smoke Test', phone: '9896052010', email: `smoke-${unique}@example.test`, project: firstProject.title, projectId: firstProject._id, message: 'Integration enquiry for cleanup.' }) });
    data = await json(response); assert(response.status === 201 && data.success, 'enquiry submission failed'); created.enquiries.push(data.data.id); console.log('PASS enquiry submission and project relationship');
    response = await req('/api/visits', { method: 'POST', body: JSON.stringify({ name: 'Smoke Test', phone: '9896052010', project: firstProject.title, projectId: firstProject._id, visitDate: new Date(Date.now() + 5 * 86400000).toISOString() }) });
    data = await json(response); assert(response.status === 201 && data.success, 'visit scheduling failed'); created.visits.push(data.data.id); console.log('PASS future visit scheduling and project relationship');
    response = await req('/api/visits', { method: 'POST', body: JSON.stringify({ name: 'Smoke Test', phone: '9896052010', project: firstProject.title, visitDate: '2000-01-01' }) }); assert(response.status === 400, 'past visit should be rejected');

    response = await req('/api/auth/signup', { method: 'POST', body: JSON.stringify({ fullName: 'Smoke User', email: `user-${unique}@example.test`, phone: '9896052010', password: 'SmokePass123!' }) }); data = await json(response); assert(response.status === 201 && data.success, 'signup failed'); const userId = data.user.id; created.users.push(userId); const user = await User.findById(userId);
    response = await req('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: user.email, password: 'wrong-password' }) }); assert(response.status === 401, 'bad login should be rejected');
    response = await req('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: user.email, password: 'SmokePass123!' }) }); data = await json(response); assert(response.ok && data.user.role === 'user', 'login failed'); const userCookie = response.headers.get('set-cookie').split(';')[0];
    response = await req('/api/auth/me', {}, userCookie); data = await json(response); assert(response.ok && data.success && data.user.email === user.email, 'authenticated current-user lookup failed');
    response = await req('/api/projects', { method: 'POST', body: JSON.stringify({ title: 'Forbidden', category: ['test'], location: 'Test', image: 'images/home-hero.jpg' }) }, userCookie); assert(response.status === 403, 'non-admin project write must be forbidden');
    response = await req('/api/auth/logout', { method: 'POST' }, userCookie); assert(response.ok, 'logout failed'); console.log('PASS signup-compatible password hashing, login, session lookup, role authorization, and logout');

    const admin = await User.create({ fullName: 'Smoke Admin', email: `admin-${unique}@example.test`, phone: '9896052010', password: 'SmokeAdminPass123!', role: 'admin' }); created.users.push(admin._id);
    response = await req('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: admin.email, password: 'SmokeAdminPass123!' }) }); data = await json(response); assert(response.ok && data.user.role === 'admin', 'admin login failed'); const adminCookie = response.headers.get('set-cookie').split(';')[0];
    response = await req('/api/enquiries', {}, adminCookie); data = await json(response); assert(response.ok && data.data.some(item => String(item._id) === String(created.enquiries[0])), 'admin enquiry read failed');
    response = await req('/api/visits', {}, adminCookie); data = await json(response); assert(response.ok && data.data.some(item => String(item._id) === String(created.visits[0])), 'admin visit read failed');
    response = await req('/api/feedback', {}, adminCookie); data = await json(response); assert(response.ok && data.data.some(item => String(item._id) === String(created.feedback[0])), 'admin feedback read failed');
    response = await req(`/api/feedback/${created.feedback[0]}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'Reviewed' }) }, adminCookie); data = await json(response); assert(response.ok && data.data.status === 'Reviewed', 'feedback status update failed');
    response = await req(`/api/enquiries/${created.enquiries[0]}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'Contacted' }) }, adminCookie); assert(response.ok, 'enquiry status update failed');
    response = await req(`/api/visits/${created.visits[0]}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'Cancelled' }) }, adminCookie); assert(response.ok, 'visit status update failed');
    response = await req('/api/projects', { method: 'POST', body: JSON.stringify({ title: `Smoke Project ${unique}`, category: ['testing'], location: 'Test', image: 'images/home-hero.jpg', featured: false }) }, adminCookie); data = await json(response); assert(response.status === 201, 'admin project creation failed'); created.projects.push(data.data._id);
    response = await req(`/api/projects/${created.projects[0]}`, { method: 'PATCH', body: JSON.stringify({ price: 'Test price' }) }, adminCookie); data = await json(response); assert(response.ok && data.data.price === 'Test price', 'admin project update failed');     response = await req('/api/auth/users', {}, adminCookie); data = await json(response); assert(response.ok && data.data.some(item => item._id === String(userId) && !Object.hasOwn(item, 'password')), 'admin user list failed or exposed password');
    response = await req('/api/auth/users/' + userId, { method: 'PATCH', body: JSON.stringify({ fullName: 'Smoke User Updated' }) }, adminCookie); data = await json(response); assert(response.ok && data.user.fullName === 'Smoke User Updated', 'admin user update failed');
    console.log('PASS administrator reads, CRUD, and status management');
    for (const page of ['/', '/about.html', '/contact.html', '/projects.html', '/project-details.html', '/login.html', '/signup.html', '/feedback.html', '/js/script.js']) { const pageResponse = await req(page); assert(pageResponse.status === 200, 'static page failed'); }    for (const privatePath of ['/server.js', '/package.json', '/config/db.js', '/scripts/seed.js']) { const privateResponse = await req(privatePath); assert(privateResponse.status === 404, 'private source file was served'); }
    response = await req(`/api/auth/users/${userId}`, { method: 'DELETE' }, adminCookie); assert(response.ok, 'admin user delete failed');
    await Promise.all([Enquiry.findByIdAndUpdate(created.enquiries[0], { projectId: created.projects[0] }), Visit.findByIdAndUpdate(created.visits[0], { projectId: created.projects[0] }), Feedback.findByIdAndUpdate(created.feedback[0], { projectId: created.projects[0] })]);
    response = await req(`/api/projects/${created.projects[0]}`, { method: 'DELETE' }, adminCookie); assert(response.ok, 'admin project delete failed');
    const [linkedEnquiry, linkedVisit, linkedFeedback] = await Promise.all([Enquiry.findById(created.enquiries[0]), Visit.findById(created.visits[0]), Feedback.findById(created.feedback[0])]);
    assert(!linkedEnquiry.projectId && !linkedVisit.projectId && !linkedFeedback.projectId, 'project deletion did not clear optional references');
    console.log('PASS pages, private-source blocking, project reference cleanup, and user CRUD');
  } finally {
    await Promise.all([
      Feedback.deleteMany({ _id: { $in: created.feedback } }), Enquiry.deleteMany({ _id: { $in: created.enquiries } }), Visit.deleteMany({ _id: { $in: created.visits } }), Project.deleteMany({ _id: { $in: created.projects } }), User.deleteMany({ _id: { $in: created.users } })
    ]);
    await new Promise(resolve => server.close(resolve));
    await mongoose.connection.close();
  }
}
main().then(() => { console.log('Integration suite passed; temporary records were removed.'); }).catch(error => { console.error('Integration suite failed:', error.message); process.exitCode = 1; });







