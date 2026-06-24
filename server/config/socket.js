import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { ENV } from './env.js';

let ioInstance;

export const setupSocket = (io) => {
  ioInstance = io;

  // Authentication Middleware for socket
  io.use(async (socket, next) => {
    try {
      // Token usually sent via headers or auth payload
      const token = socket.handshake.auth?.token || 
                    socket.handshake.headers?.cookie?.split('token=')[1]?.split(';')[0];

      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decodedToken = jwt.verify(token, ENV.JWT_SECRET);
      const user = await User.findById(decodedToken._id).select('-password');

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id} (User: ${socket.user._id})`);

    // Join a room unique to this user ID to receive targeted events
    socket.join(socket.user._id.toString());

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};

export const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.io not initialized!');
  }
  return ioInstance;
};
