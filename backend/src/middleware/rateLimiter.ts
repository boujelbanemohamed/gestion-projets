import rateLimit from 'express-rate-limit';

export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'),
  message: { error: 'Trop de requêtes, veuillez réessayer plus tard' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const path = req.path || '';
    const method = req.method || '';
    if (method === 'OPTIONS') return true;
    if (path === '/api/health' || path === '/api/test') return true;
    if (path.startsWith('/api/auth/')) return true;
    return false;
  },
});