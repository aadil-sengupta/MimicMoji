import React from 'react';
import { UsernameProvider } from './UsernameContext';
import { WebSocketProvider } from './WebSocketContext';

export const AppProviders = ({ children }) => {
  return (
    <UsernameProvider>
      <WebSocketProvider>
        {children}
      </WebSocketProvider>
    </UsernameProvider>
  );
};

export default AppProviders;
