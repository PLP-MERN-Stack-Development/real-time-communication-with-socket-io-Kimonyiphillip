import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL;

export function useSocket(userId) {
  const socketRef = useRef(null);
  const [socketInstance, setSocketInstance] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Map());

  useEffect(() => {
    if (!userId) return;

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      auth: { userId },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;
    setSocketInstance(socket);

    // Connection events
    socket.on("connect", () => {
      setIsConnected(true);
      console.log("Socket connected");
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    // User status events
    socket.on("user:status", (data) => {
      const { userId, status } = data;
      setOnlineUsers(prev => {
        const next = new Set(prev);
        if (status === "online") {
          next.add(userId);
        } else {
          next.delete(userId);
        }
        return next;
      });
    });

    // Typing indicators
    socket.on("typing:start", (data) => {
      const { userId, conversationId } = data;
      setTypingUsers(prev => {
        const next = new Map(prev);
        const users = next.get(conversationId) || new Set();
        users.add(userId);
        next.set(conversationId, users);
        return next;
      });
    });

    socket.on("typing:stop", (data) => {
      const { userId, conversationId } = data;
      setTypingUsers(prev => {
        const next = new Map(prev);
        const users = next.get(conversationId);
        if (users) {
          users.delete(userId);
          if (users.size === 0) {
            next.delete(conversationId);
          } else {
            next.set(conversationId, users);
          }
        }
        return next;
      });
    });

    // Message reactions
    socket.on("message:react", (data) => {
      // This will be handled in the component
    });

    // Notifications
    socket.on("notification:new", (data) => {
      // Handle browser notifications
      if (Notification.permission === "granted") {
        new Notification("New Message", {
          body: `${data.message.senderName}: ${data.message.text}`,
          icon: "/icon.png"
        });
      }
    });

    return () => {
      const socket = socketRef.current;
      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
      }
      socketRef.current = null;
      setSocketInstance(null);
      setIsConnected(false);
      setOnlineUsers(new Set());
      setTypingUsers(new Map());
    };
  }, [userId]);

  // Typing indicator methods
  const startTyping = useCallback((conversationId) => {
    if (socketRef.current && conversationId) {
      socketRef.current.emit("typing:start", { conversationId });
    }
  }, []);

  const stopTyping = useCallback((conversationId) => {
    if (socketRef.current && conversationId) {
      socketRef.current.emit("typing:stop", { conversationId });
    }
  }, []);

  // Reaction method
  const sendReaction = useCallback((messageId, conversationId, reaction) => {
    if (socketRef.current && messageId && conversationId && reaction) {
      socketRef.current.emit("message:react", {
        messageId,
        conversationId,
        reaction
      });
    }
  }, []);

  return {
    socket: socketInstance,
    isConnected,
    onlineUsers,
    typingUsers,
    startTyping,
    stopTyping,
    sendReaction
  };
}