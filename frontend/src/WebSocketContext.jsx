import React, { createContext, useContext, useRef, useEffect, useState } from "react";

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL;
    const socket = new WebSocket(`${WEBSOCKET_URL}/ws.room`);
    wsRef.current = socket;

    socket.onopen = () => setIsConnected(true);
    socket.onclose = () => setIsConnected(false);

    return () => {
      socket.close();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ ws: wsRef.current, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
