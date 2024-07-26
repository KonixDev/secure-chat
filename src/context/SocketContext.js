"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  initializeSocket,
  sendAuthenticationDetails,
  sendSocketAudioMessage,
  sendMessage as sendSocketMessage
} from "../utils/socketUtils";
import { initializeE2EE, clearStoredKeyPair } from "../utils/e2eeClient";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [initMessages, setInitMessages] = useState([]);
  const [nickname, setNickname] = useState("");
  const [masterKey, setMasterKey] = useState("");
  const [roomId, setRoomId] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [socket, setSocket] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState([]);
  const [clientInstanceE2EE, setClientInstanceE2EE] = useState(null);
  const [publicKeys, setPublicKeys] = useState({});
  const [publicKeysSetted, setPublicKeysSetted] = useState(false);

  useEffect(
    () => {
      const initializeE2EEInstance = async () => {
        const clientE2EE = await initializeE2EE();
        setClientInstanceE2EE(clientE2EE);
      };

      if (!clientInstanceE2EE) {
        initializeE2EEInstance().catch(console.error);
      }
    },
    [clientInstanceE2EE]
  );

  useEffect(
    () => {
      const setRemotePublicKeysAndDecrypt = async () => {
        if (!clientInstanceE2EE || initMessages.length === 0) return;
        setPublicKeysSetted(true);
        decryptInitialMessages();
      };

      const decryptInitialMessages = async () => {
        if (
          !clientInstanceE2EE ||
          initMessages.length === 0 ||
          !publicKeysSetted
        )
          return;
        console.log("Decrypting initial messages");
        const messagesDecrypted = await handleMessages(
          initMessages,
          clientInstanceE2EE,
          nickname
        );
        setMessages(messagesDecrypted);
      };

      if (Object.keys(publicKeys).length > 0) {
        setPublicKeysSetted(false);
        setRemotePublicKeysAndDecrypt().catch(console.error);
      }
    },
    [publicKeys, clientInstanceE2EE, initMessages, nickname]
  );

  useEffect(
    () => {
      if (socket && masterKey && nickname && roomId && !authenticated) {
        sendAuthenticationDetails(masterKey, nickname, roomId);
      }
    },
    [socket, authenticated, masterKey, nickname, roomId]
  );

  const authenticate = (masterKey, nickname, roomId) => {
    if (
      !masterKey ||
      !nickname ||
      !roomId ||
      !clientInstanceE2EE ||
      authenticated
    )
      return;
    setMasterKey(masterKey);
    setNickname(nickname);
    setRoomId(roomId);
    const newSocket = initializeSocket({
      masterKey,
      nickname,
      roomId,
      setMessages,
      setInitMessages,
      setAuthenticated,
      setSelectedRoom,
      clientInstanceE2EE,
      publicKeys,
      setPublicKeys
    });
    setSocket(newSocket);
  };

  const sendMessage = (msg) => {
    if (socket) {
      sendSocketMessage(msg, clientInstanceE2EE, publicKeys);
    }
  };

  const sendAudioMessage = audioBlob => {
    if (socket) {
      sendSocketAudioMessage(audioBlob.text.audio.text, clientInstanceE2EE, publicKeys);
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
      socket.emit("clearMessages");
    }
  };

  const clearKeyPair = () => {
    clearStoredKeyPair();
    setClientInstanceE2EE(null);
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        messages,
        nickname,
        authenticated,
        selectedRoom,
        authenticate,
        sendMessage,
        sendAudioMessage,
        editMessage,
        deleteMessage,
        clearMessages,
        clearKeyPair
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
