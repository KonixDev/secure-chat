"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [nickname, setNickname] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [socket, setSocket] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState([]);

  const authenticate = (masterKey, nickname, roomId) => {
    if (!masterKey || !nickname || !roomId) {
      return;
    }

    if (authenticated) {
      return;
    }

    const socketInstance = io("http://localhost:4000", {
      auth: {
        masterKey: masterKey,
        nickname: nickname,
        roomId: roomId
      }
    });

    socketInstance.on("connect_error", err => {
      console.error("Authentication error:", err.message);
      setAuthenticated(false);
    });

    socketInstance.emit("authenticate", { masterKey, nickname, roomId });

    socketInstance.on("authenticated", () => {
      console.log("Authenticated successfully");
      setSocket(socketInstance);
      setAuthenticated(true);
      setNickname(nickname);
    });

    socketInstance.on("initialMessages", msgs => {
      setMessages(msgs);
    });

    socketInstance.on("roomData", roomData => {
      if (roomData) {
        setSelectedRoom(roomData);
        setMessages(roomData.messages);
      }
    });

    socketInstance.on("message", msg => {
      setMessages(prev => [...prev, msg]);
    });

    socketInstance.on("messagesUpdated", msgs => {
      setMessages(msgs);
    });
  };

  const sendMessage = message => {
    if (socket) {
      socket.emit("message", message);
    }
  };

  const editMessage = (id, newText) => {
    if (socket) {
      socket.emit("editMessage", { id, newText });
    }
  };

  const deleteMessage = id => {
    if (socket) {
      socket.emit("deleteMessage", id);
    }
  };

  const clearMessages = () => {
    if (socket) {
      setMessages([]);
      socket.emit("clearMessages", "clearMessages");
    }
  };

  return (
    <SocketContext.Provider
      value={{
        messages,
        nickname,
        authenticated,
        selectedRoom,
        authenticate,
        sendMessage,
        editMessage,
        deleteMessage,
        clearMessages
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
