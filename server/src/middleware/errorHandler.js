export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  let status = err.statusCode || err.status || 500;
  let code = typeof err.code === 'string' ? err.code : 'INTERNAL_ERROR';
  let message = err.message || 'Internal Server Error';

  if (err.name === 'CastError') {
    status = 400;
    code = 'INVALID_ID';
    message = 'Invalid identifier format';
  } else if (err.name === 'ValidationError') {
    status = 400;
    code = 'VALIDATION_ERROR';
    message = Object.values(err.errors || {})[0]?.message || 'Validation failed';
  } else if (err.code === 11000) {
    status = 409;
    code = 'DUPLICATE';
    message = 'A record with these details already exists';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    code = 'INVALID_JSON';
    message = 'Malformed JSON request body';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    code = 'PAYLOAD_TOO_LARGE';
    message = 'Request body is too large';
  }

  if (status >= 500) {
    console.error('[API Error]:', err);
    // Do not leak internals (Mongoose messages, stack details) in production.
    if (process.env.NODE_ENV === 'production') message = 'Internal Server Error';
  }

  res.status(status).json({ error: { message, code } });
};
