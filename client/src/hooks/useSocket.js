import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
  const socket = useMemo(() => io(socketUrl, { autoConnect: false, transports: ['websocket', 'polling'] }), [socketUrl]);

  useEffect(() => {
    const connect = () => setConnected(true);
    const disconnect = () => setConnected(false);
    socket.on('connect', connect);
    socket.on('disconnect', disconnect);
    socket.connect();
    return () => { socket.off('connect', connect); socket.off('disconnect', disconnect); socket.disconnect(); };
  }, [socket]);

  function emit(event, payload) {
    return new Promise((resolve, reject) => {
      socket.emit(event, payload, response => response?.ok ? resolve(response) : reject(new Error(response?.error || 'Request failed.')));
    });
  }

  return { socket, connected, emit };
}
