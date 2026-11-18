const crypto = require('crypto');
const User = require('../models/User');
const secret = () => process.env.SESSION_SECRET || crypto.createHash('sha256').update(`${process.env.MONGO_URI || 'local'}:mhara-session`).digest('hex');
const sign = payload => {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  return `${body}.${signature}`;
};
const issueSession = (res, user, remember = false) => {
  const lifetime = remember ? 7 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000;
  const token = sign({ sub: String(user._id), exp: Date.now() + lifetime });
  res.cookie('mhara_session', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', ...(remember ? { maxAge: lifetime } : {}), path: '/' });
};
const readSession = token => {
  if (typeof token !== 'string') return null;
  const [body, signature] = token.split('.');
  if (!body || !signature) return null;
  const expected = crypto.createHmac('sha256', secret()).update(body).digest();
  let actual;
  try { actual = Buffer.from(signature, 'base64url'); } catch { return null; }
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    return payload.exp > Date.now() && payload.sub ? payload : null;
  } catch { return null; }
};
const requireAuth = async (req, res, next) => {
  try {
    const payload = readSession(req.cookies?.mhara_session);
    if (!payload) return res.status(401).json({ success: false, error: 'Authentication required' });
    const user = await User.findById(payload.sub).select('_id fullName email role phone');
    if (!user) return res.status(401).json({ success: false, error: 'Session is no longer valid' });
    req.user = user;
    next();
  } catch (error) { next(error); }
};
const requireAdmin = [requireAuth, (req, res, next) => req.user.role === 'admin' ? next() : res.status(403).json({ success: false, error: 'Administrator access required' })];
module.exports = { issueSession, readSession, requireAuth, requireAdmin };
