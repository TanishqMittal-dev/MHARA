const buckets = new Map();
function rateLimit({ windowMs = 15 * 60 * 1000, max = 10, message = 'Too many requests. Please try again later.' } = {}) {
  return (req, res, next) => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) { bucket = { count: 0, resetAt: now + windowMs }; buckets.set(key, bucket); }
    bucket.count += 1;
    if (buckets.size > 5000) for (const [id, current] of buckets) if (current.resetAt <= now) buckets.delete(id);
    res.set('RateLimit-Limit', String(max));
    res.set('RateLimit-Remaining', String(Math.max(0, max - bucket.count)));
    if (bucket.count > max) return res.status(429).json({ success: false, error: message });
    next();
  };
}
module.exports = rateLimit;
