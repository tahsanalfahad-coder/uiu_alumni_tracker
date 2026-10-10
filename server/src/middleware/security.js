// Baseline security headers (a dependency-free subset of what `helmet` sets).
export const securityHeaders = (req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'X-DNS-Prefetch-Control': 'off',
    'X-Permitted-Cross-Domain-Policies': 'none'
  });
  if (process.env.NODE_ENV === 'production') {
    res.set('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  }
  next();
};
