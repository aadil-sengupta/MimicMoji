import React, { createContext, useContext, useRef, useEffect, useState } from "react";
import { useUsername } from './UsernameContext';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const wsRef = useRef(null);
  const listenersRef = useRef(new Map());
  const { username, isUsernameSet, setRandomUsername } = useUsername();

  useEffect(() => {
    const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL || 'wss://5.78.154.173:8001';
    const socket = new WebSocket(`${WEBSOCKET_URL}/ws/room/`); // Fixed URL path
    wsRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setConnectionStatus('connected');
      
      // Automatically send username when connection is established
      const currentUsername = username || setRandomUsername();
      if (currentUsername) {
        console.log('Sending username:', currentUsername);
        socket.send(JSON.stringify({
          type: 'user',
          username: currentUsername
        }));
      }
    };
    
    socket.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      setConnectionStatus('disconnected');
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('error');
    };
    
    socket.onmessage = (event) => {
      console.log('WebSocket message received:', event.data);
      
      try {
        const data = JSON.parse(event.data);
        
        // Call all listeners for this message type
        const messageListeners = listenersRef.current.get(data.type) || [];
        messageListeners.forEach(listener => {
          try {
            listener(data);
          } catch (error) {
            console.error('Error in message listener:', error);
          }
        });
        
        // Call all global listeners (listening for '*')
        const globalListeners = listenersRef.current.get('*') || [];
        globalListeners.forEach(listener => {
          try {
            listener(data);
          } catch (error) {
            console.error('Error in global listener:', error);
          }
        });
        
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    return () => {
      socket.close();
    };
  }, [username]); // Add username as dependency to re-send if it changes

  return (
    <WebSocketContext.Provider value={{ 
      ws: wsRef.current, 
      isConnected, 
      connectionStatus,
      sendMessage: (message) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify(message));
          return true;
        }
        console.warn('WebSocket not connected, message not sent:', message);
        return false;
      },
      addEventListener: (messageType, callback) => {
        if (!listenersRef.current.has(messageType)) {
          listenersRef.current.set(messageType, []);
        }
        listenersRef.current.get(messageType).push(callback);
        
        // Return cleanup function
        return () => {
          const listeners = listenersRef.current.get(messageType) || [];
          const index = listeners.indexOf(callback);
          if (index > -1) {
            listeners.splice(index, 1);
          }
        };
      },
      removeEventListener: (messageType, callback) => {
        const listeners = listenersRef.current.get(messageType) || [];
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
