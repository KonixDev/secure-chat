"use client";

import { io } from "socket.io-client";
import { encodeToBuffer, decodeFromBuffer } from "../utils/cryptoUtils";

let socket;
let secretKey;
let iv;
let mediaRecorder;
let audioChunks = [];

let isOnCall = false;

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
      socket.emit(
        "sharePublicKey",
        await encodeToBuffer({
          data: { publicKey: ownPublicKey, nickname },
          secret: secretKey,
          iv
        })
      );
    });

    socket.on("keys", data => {
      secretKey = new Uint8Array(
        data.SECRET_KEY.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
      );
      iv = new Uint8Array(
        data.IV.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
      );
    });

    socket.on("message", async buffer => {
      try {
        const msg = await decodeFromBuffer({ buffer, secret: secretKey, iv });
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
        setMessages(prev => [
          ...prev,
          { ...buffer, text: "[Encrypted message]" }
        ]);
      }
    });

    socket.on("audio", async buffer => {
      try {
        const msg = await decodeFromBuffer({ buffer, secret: secretKey, iv });
        const targetMessage = msg.audio.find(p => p.nickname === nickname);
        if (targetMessage) {
          let decryptedMessage = await clientInstanceE2EE.decrypt(
            targetMessage.message,
            msg.nickname
          );

          if (!(decryptedMessage instanceof Uint8Array)) {
            decryptedMessage = new Uint8Array(decryptedMessage.split(',').map(Number));
          }
          const blob = new Blob([decryptedMessage], { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);

          setMessages(prev => [
            ...prev,
            { ...msg, text: "[Encrypted Audio]", audio: url }
          ]);
        } else {
          setMessages(prev => [
            ...prev,
            { ...msg, text: "[Encrypted Audio]" }
          ]);
        }
      } catch (error) {
        console.error("Decryption failed:", error);
        setMessages(prev => [
          ...prev,
          { ...buffer, text: "[Encrypted Audio]" }
        ]);
      }
    });

    socket.on("publicKey", async buffer => {
      if (clientInstanceE2EE) {
        const data = await decodeFromBuffer({ buffer, secret: secretKey, iv });
        setPublicKeys(prev => ({ ...prev, [data.nickname]: data.publicKey }));
      }
    });

    socket.on("publicKeys", async buffer => {
      if (clientInstanceE2EE) {
        const data = await decodeFromBuffer({ buffer, secret: secretKey, iv });
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

    socket.on("roomMessages", async buffer => {
      const messages = await decodeFromBuffer({
        buffer,
        secret: secretKey,
        iv
      });
      const decryptedMessages = await handleMessages(
        messages,
        clientInstanceE2EE,
        nickname
      );
      setMessages(decryptedMessages);
    });
 
    socket.on('server-call-joined', async (msg) => {
      startAudioCapture();
    });
    
    socket.on("server-call-left", async (msg) => {
      //decode 
      console.log('Server call left', msg);
      const { userId, nickname, roomId: serverRoom } = msg;
      if (!userId || !nickname || !serverRoom) return;
      if (roomId !== serverRoom) return;
      stopAudioCapture();
      console.log('Server call left');
    });
   
  }

  return socket;
};

const startAudioCapture = () => {
  isOnCall = true;
  navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    .then((stream) => {
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.addEventListener("dataavailable", function (event) {
            audioChunks.push(event.data);
        });

        mediaRecorder.addEventListener("stop", function () {
          if (!isOnCall) {
            console.log('Call ended');
            return;
          }
            var audioBlob = new Blob(audioChunks);
            audioChunks = [];
            var fileReader = new FileReader();
            fileReader.readAsDataURL(audioBlob);
            fileReader.onloadend = function () {
                var base64String = fileReader.result;
                socket.emit("audioStream", base64String);
            };

            mediaRecorder.start();
            setTimeout(function () {
              if (mediaRecorder && mediaRecorder.state !== "inactive") {
                mediaRecorder.stop();
              }
            }, 250);
        });

        mediaRecorder.start();
        setTimeout(function () {
            mediaRecorder.stop();
        }, 250);
    })
    .catch((error) => {
        console.error('Error capturing audio.', error);
    });

    socket.on('audioStream', (audioData) => {
      var newData = audioData.split(";");
      newData[0] = "data:audio/ogg;";
      newData = newData[0] + newData[1];
  
      var audio = new Audio(newData);
      if (!audio || document.hidden) {
          return;
      }
      audio.play();
  });
};

const stopAudioCapture = () => {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    isOnCall = false;
    mediaRecorder.stop();
    // Cancel microphone access
    mediaRecorder.stream.getAudioTracks().forEach(track => track.stop());
  }
};

export const initiateAudioCall = async ({ roomId, nickname }) => {
    socket.emit("join-room-call", "");
}; 

export const leaveAudioCall = async ({ roomId, nickname }) => {
    socket.emit("leave-room-call", "");
    stopAudioCapture();
}

export const sendMessage = async (msg, clientInstanceE2EE, publicKeys) => {
  if (socket && clientInstanceE2EE) {
    const encryptedMessages = await encryptMessageToAllParticipants(
      msg.text,
      publicKeys,
      clientInstanceE2EE,
      msg?.type
    );
    socket.emit(
      "message",
      await encodeToBuffer({
        data: { data: { participants: encryptedMessages }, type: msg?.type },
        secret: secretKey,
        iv
      })
    );
  }
};

const encryptMessageToAllParticipants = async (
  message,
  participants,
  clientInstanceE2EE,
  type
) => {
  return await Promise.all(
    Object.entries(participants).map(async ([key]) => {
      const encryptedMessage = await clientInstanceE2EE.encrypt(message, key);
      return { nickname: key, message: encryptedMessage, type: type || "text" };
    })
  );
};

export const sendSocketAudioMessage = async (
  audioBlob,
  clientInstanceE2EE,
  publicKeys
) => {
  const reader = new FileReader();
  reader.readAsArrayBuffer(audioBlob);
  reader.onloadend = async () => {
    const arrayBuffer = reader.result;
    const encodedArrayBuffer = new Uint8Array(arrayBuffer);
    const encryptedMessages = await encryptMessageToAllParticipants(
      encodedArrayBuffer,
      publicKeys,
      clientInstanceE2EE,
      "audio"
    );
    socket.emit(
      "audioMessage",
      await encodeToBuffer({
        data: { data: { participants: encryptedMessages }, type: "audio" },
        secret: secretKey,
        iv
      })
    );
 
  };
};

export const handleMessages = async (
  messages,
  clientInstanceE2EE,
  nickname
) => {
  const result = await Promise.all(
    messages.map(async m => {
      try {
        let targetMessage = null;
        if (m.text && m.text.length > 0) {
          targetMessage = m.text.find(p => p.nickname === nickname);
        } else if (m.audio) {
          targetMessage = m.audio.find(p => p.nickname === nickname);
        }
        if (targetMessage) {
          let decryptedMessage = await clientInstanceE2EE.decrypt(
            targetMessage.message,
            m.nickname
          );
          if (m.audio){
            if (!(decryptedMessage instanceof Uint8Array)) {
              decryptedMessage = new Uint8Array(decryptedMessage.split(',').map(Number));
            }
            const blob = new Blob([decryptedMessage], { type: 'audio/webm' });
            const url = URL.createObjectURL(blob);
            return { ...m, text: "[Encrypted Audio]", audio: url };
          }

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

export const sendAuthenticationDetails = async (
  masterKey,
  nickname,
  roomId
) => {
  if (!masterKey || !nickname || !roomId) return;
  const encodedDetails = await encodeToBuffer({
    data: { masterKey, nickname, roomId }
  });
  socket.emit("authenticate", encodedDetails);
};
