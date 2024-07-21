"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  initializeSocket,
  sendAuthenticationDetails,
  sendMessage as sendSocketMessage
} from "../utils/socketUtils";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [nickname, setNickname] = useState("");
  const [masterKey, setMasterKey] = useState("");
  const [roomId, setRoomId] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [socket, setSocket] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState([]);

  useEffect(
    () => {
      console.log({ messages });
    },
    [messages]
  );

  useEffect(
    () => {
      if (!socket) return;
      if (!authenticated && masterKey && nickname && roomId) {
        sendAuthenticationDetails(masterKey, nickname, roomId);
      }
    },
    [socket, authenticated, masterKey, nickname, roomId]
  );

  const authenticate = (masterKey, nickname, roomId) => {
    if (!masterKey || !nickname || !roomId || authenticated) return;
    setMasterKey(masterKey);
    setNickname(nickname);
    setRoomId(roomId);
    setSocket(
      initializeSocket({
        masterKey,
        nickname,
        roomId,
        setMessages,
        setAuthenticated,
        setNickname,
        setSelectedRoom,
      })
    );
  };

  const sendMessage = text => {
    if (socket) {
      sendSocketMessage(text);
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
