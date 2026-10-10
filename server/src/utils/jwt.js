import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/env.js';

const ALGORITHM = 'HS256';

export const signToken = (user) =>
  jwt.sign(
    { id: user._id, email: user.email, role: user.role, status: user.status },
    getJwtSecret(),
    { algorithm: ALGORITHM, expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
  );

// Pin the algorithm so tokens signed with "none" or another algorithm are rejected.
export const verifyToken = (token) =>
  jwt.verify(token, getJwtSecret(), { algorithms: [ALGORITHM] });
