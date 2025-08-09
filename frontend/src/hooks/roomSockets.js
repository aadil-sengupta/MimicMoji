import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

export function useSocket(onConnect) {
  const socketRef = useRef(null);

  useEffect(() => {
    const url = import.meta.env.VITE_SOCKET_URL;
    const s = io(url, { transports: ["websocket"] });
    socketRef.current = s;

    s.on("connect", () => onConnect?.(s));
    return () => s.disconnect();
  }, [onConnect]);

  return socketRef;
}
