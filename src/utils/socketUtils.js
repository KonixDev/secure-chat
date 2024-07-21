'use client';

import { io } from "socket.io-client";
let socket;

export const initializeSocket = ({
  masterKey,
  nickname,
  roomId,
  setMessages,
  setAuthenticated,
  setNickname,
  setSelectedRoom,
  setPublicKeys
}) => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKETIO_SERVER, {
      auth: {
        masterKey: masterKey,
        nickname: nickname,
        roomId: roomId
      },
      secure: true,
      reconnection: true,
      rejectUnauthorized: false // Solo para desarrollo
    });

    socket.on("connect_error", err => {
      console.error("Authentication error:", err.message);
      setAuthenticated(false);
    });

    socket.on("connect", () => {
      console.log("Connected to server");
    });

    socket.on("authenticated", () => {
      console.log("Authenticated successfully");
      setAuthenticated(true);
    });

    const handleMessages = async msg => {
      setMessages(msg);
    };

    socket.on("initialMessages", handleMessages);
    socket.on("roomData", async roomData => {
      if (roomData) {
        setSelectedRoom(roomData);
        await handleMessages(roomData.messages);
      }
    });

    socket.on("message", async msg => {
      try {
        setMessages(prev => [...prev, { ...msg, text: msg.text }]);
      } catch (error) {
        console.error("Decryption failed:", error);
        setMessages(prev => [...prev, { ...msg, text: "[Encrypted message]" }]);
      }
    });

    socket.on("messagesUpdated", handleMessages);
  }

  return socket;
};

export const sendMessage = async (msg) => {
  if (socket) {
    socket.emit("message", { messageData: msg.text });
  }
};

export const sendAuthenticationDetails = (masterKey, nickname, roomId) => {
  if (!masterKey || !nickname || !roomId) return;
  socket.emit("authenticate", { masterKey, nickname, roomId });
};
