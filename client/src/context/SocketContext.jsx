import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth.js';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Only connect if the user is logged in
    if (user) {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const socketUrl = apiUrl ? apiUrl.replace(/\/api\/v3\/?$/, '') : window.location.origin;

      const socketInstance = io(socketUrl, {
        withCredentials: true,
      });

      setSocket(socketInstance);

      socketInstance.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
      });

      // Global event listener for generic notifications, optional
      // socketInstance.on('notification', (message) => toast(message));

      return () => {
        socketInstance.disconnect();
      };
    } else if (socket) {
      // User logged out, disconnect the socket
      socket.disconnect();
      setSocket(null);
    }
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
