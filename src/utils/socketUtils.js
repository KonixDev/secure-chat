"use client";

import { io } from "socket.io-client";

let socket;

export const initializeSocket = ({
  masterKey,
  nickname,
  roomId,
  setMessages,
  setAuthenticated,
  clientInstanceE2EE,
  setPublicKeys
}) => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKETIO_SERVER, {
      auth: {
        masterKey,
        nickname,
        roomId
      },
      secure: true,
      reconnection: true,
      rejectUnauthorized: false // Only for development
    });

    socket.on("connect_error", err => {
      console.error("Authentication error:", err.message);
      setAuthenticated(false);
    });

    socket.on("connect", () => {
      console.log("Connected to server");
    });

    socket.on("authenticated", async () => {
      console.log("Authenticated successfully");
      setAuthenticated(true);
      const ownPublicKey = await clientInstanceE2EE.exportPublicKey();
      setPublicKeys(prev => ({ ...prev, [nickname]: ownPublicKey }));
      socket.emit("sharePublicKey", { publicKey: ownPublicKey, nickname });
    });

    socket.on("roomMessages", async messages => {
      console.log("Received room messages:", messages);
      const decryptedMessages = await handleMessages(
        messages,
        clientInstanceE2EE,
        nickname
      );
      setMessages(decryptedMessages);
    });

    socket.on("message", async msg => {
      try {
        const targetMessage = msg.text.find(p => p.nickname === nickname);
        if (targetMessage) {
          const decryptedMessage = await clientInstanceE2EE.decrypt(
            targetMessage.message,
            msg.nickname
          );
          setMessages(prev => [...prev, { ...msg, text: decryptedMessage }]);
        } else {
          setMessages(prev => [
            ...prev,
            { ...msg, text: "[Encrypted message]" }
          ]);
        }
      } catch (error) {
        console.error("Decryption failed:", error);
        setMessages(prev => [...prev, { ...msg, text: "[Encrypted message]" }]);
      }
    });

    socket.on("publicKey", async data => {
      if (clientInstanceE2EE) {
        setPublicKeys(prev => ({ ...prev, [data.nickname]: data.publicKey }));
      }
    });

    socket.on("publicKeys", async data => {
      if (clientInstanceE2EE) {
        console.log({ data });
        const length = Object.keys(data).length;
        if (length === 0) return;
        const setKeysPromises = Object.entries(data).map(([key, value]) =>
          clientInstanceE2EE.setRemotePublicKey(value, key)
        );
        await Promise.all(setKeysPromises).then(() => {
          setPublicKeys(prev => ({ ...prev, ...data }));
          console.log("Public keys set successfully");
        });
      }
    });
  }

  return socket;
};

const encryptMessageToAllParticipants = async (
  message,
  participants,
  clientInstanceE2EE
) => {
  return await Promise.all(
    Object.entries(participants).map(async ([key]) => {
      const encryptedMessage = await clientInstanceE2EE.encrypt(message, key);
      return { nickname: key, message: encryptedMessage };
    })
  );
};

export const sendMessage = async (msg, clientInstanceE2EE, publicKeys) => {
  if (socket && clientInstanceE2EE) {
    const encryptedMessages = await encryptMessageToAllParticipants(
      msg.text,
      publicKeys,
      clientInstanceE2EE
    );
    socket.emit("message", { participants: encryptedMessages });
  }
};

export const handleMessages = async (
  messages,
  clientInstanceE2EE,
  nickname
) => {
  const result = await Promise.all(
    messages.map(async m => {
      try {
        const targetMessage = m.text.find(p => p.nickname === nickname);
        if (targetMessage) {
          const decryptedMessage = await clientInstanceE2EE.decrypt(
            targetMessage.message,
            m.nickname
          );
          return { ...m, text: decryptedMessage };
        } else {
          return { ...m, text: "[Encrypted message]" };
        }
      } catch (error) {
        console.error("Decryption failed:", error);
        return { ...m, text: "[Encrypted message]" };
      }
    })
  );
  return result;
};

export const sendAuthenticationDetails = (masterKey, nickname, roomId) => {
  if (!masterKey || !nickname || !roomId) return;
  socket.emit("authenticate", { masterKey, nickname, roomId });
};
