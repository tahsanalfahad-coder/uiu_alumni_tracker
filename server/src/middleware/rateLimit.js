// Small dependency-free fixed-window rate limiter (in-memory, per server instance).
// For multi-instance deployments swap in `express-rate-limit` with a shared store.
export const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 100,
  keyGenerator = (req) => req.ip,
  message = 'Too many requests. Please try again later.',
  enabled
} = {}) => {
  const hits = new Map();

  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key);
    }
  }, windowMs);
  sweep.unref?.();

  return (req, res, next) => {
    // Disabled in automated tests unless a test explicitly enables it.
    const active = enabled ?? process.env.NODE_ENV !== 'test';
    if (!active) return next();

    const now = Date.now();
    const key = keyGenerator(req);
    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }

    entry.count += 1;
    if (entry.count > max) {
      res.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).json({ error: { message, code: 'RATE_LIMITED' } });
    }
    next();
  };
};

const normEmail = (req) => String(req.body?.email || '').toLowerCase().slice(0, 254);

// Brute-force protection for one account (shared campus NAT users are not locked out together).
export const loginAccountLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => `${req.ip}|${normEmail(req)}`,
  message: 'Too many login attempts. Please try again in a few minutes.'
});
// Looser per-IP ceiling against credential stuffing across many accounts.
export const loginIpLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many login attempts from this network. Please try again later.'
});
export const registerLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: 'Too many registrations from this network. Please try again later.'
});
export const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 1500
});
