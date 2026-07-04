import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth.js';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (user) {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const socketUrl = apiUrl
        ? apiUrl.replace(/\/api\/v3\/?$/, '')
        : window.location.origin;

      const socketInstance = io(socketUrl, {
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      socketRef.current = socketInstance;
      setSocket(socketInstance);

      socketInstance.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
      });

      return () => {
        socketInstance.disconnect();
        socketRef.current = null;
        setSocket(null);
      };
    } else {
      // User logged out — use ref, not stale state closure
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
    }
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
