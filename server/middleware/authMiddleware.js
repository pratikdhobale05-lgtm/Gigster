// server/middleware/authMiddleware.js

import jwt from 'jsonwebtoken';
import User from '../models/User.js'; // Adjust path if User model uses .js extension

/**
 * Middleware to protect routes. It expects an Authorization header with a Bearer token.
 * If the token is valid, the corresponding user is loaded and attached to `req.user`.
 * Otherwise, a 401/403 response is sent.
 */
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');

    // Load user without password field
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }
    req.user = user; // attach to request
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

export default protect;
