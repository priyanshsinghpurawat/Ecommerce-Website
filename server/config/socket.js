import logger from './logger.js';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { ENV } from './env.js';

let ioInstance;

const parseCookie = (cookieStr, key) => {
  if (!cookieStr) return null;
  const match = cookieStr.match(new RegExp(`(?:^|; )${key}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

export const setupSocket = (io) => {
  ioInstance = io;

  // Authentication Middleware for socket
  io.use(async (socket, next) => {
    try {
      // Accept token only from the auth payload or httpOnly cookie.
      // Never from query string — URL tokens appear in server logs and browser history.
      const token =
        socket.handshake.auth?.token || parseCookie(socket.handshake.headers?.cookie, 'token');

      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decodedToken = jwt.verify(token, ENV.JWT_SECRET, { algorithms: ['HS256'] });
      const user = await User.findById(decodedToken._id).select('-password');

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id} (User: ${socket.user._id})`);

    // Join a room unique to this user ID to receive targeted events
    socket.join(socket.user._id.toString());

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });
};

export const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.io not initialized!');
  }
  return ioInstance;
};
