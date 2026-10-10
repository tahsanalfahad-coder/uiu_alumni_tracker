export const getAllowedOrigins = () =>
  (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:5174')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

// Requests without an Origin header (curl, server-to-server, same-origin) are allowed.
export const isOriginAllowed = (origin) => {
  if (!origin) return true;
  const allowed = getAllowedOrigins();
  return allowed.includes('*') || allowed.includes(origin);
};

// Signature shared by the `cors` package and Socket.IO.
export const corsOriginCheck = (origin, callback) => callback(null, isOriginAllowed(origin));
