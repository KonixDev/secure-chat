const { randomUUID } = require("crypto");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const port = 4000;
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const MASTER_KEY = "asd"; // Define tu Master Key aquí
const MESSAGE_EXPIRATION_TIME = 30 * 60 * 1000; // 30 minutos en milisegundos
let rooms = {}; // Object to store rooms and their messages
let publicKeys = {}; // Object to store public keys of users

io.use((socket, next) => {
  const { masterKey, nickname, roomId } = socket.handshake.auth;
  if (masterKey === MASTER_KEY && nickname && roomId) {
    socket.nickname = nickname;
    socket.roomId = roomId;
    return next();
  }
  return next(new Error("authentication error"));
});

io.on("connection", socket => {
  socket.on("disconnect", () => {
    delete publicKeys[socket.id];
    socket.broadcast.emit('publicKeys', publicKeys);
    console.log(`${socket.nickname} disconnected from room ${socket.roomId}`);
  });

  socket.on('sharePublicKey', ({ publicKey }) => {
    publicKeys[socket.id] = publicKey;
    socket.broadcast.emit('publicKeys', publicKeys);
    socket.emit('publicKeys', publicKeys);
  });

  socket.on("authenticate", ({ masterKey, nickname, roomId }) => {
    if (masterKey === MASTER_KEY) {
      socket.nickname = nickname;
      socket.roomId = roomId;
      socket.join(roomId);

      if (!rooms[roomId]) {
        rooms[roomId] = {
          messages: [],
          roomId: roomId,
        };
      }

      socket.emit("authenticated");
      console.log(`${nickname} connected to room ${roomId}`);
    } else {
      socket.disconnect();
    }
  });

  socket.emit('roomData', rooms[socket.roomId]);

  socket.emit("initialMessages", rooms[socket.roomId]?.messages || {});

  socket.on("clearMessages", () => {
    rooms[socket.roomId].messages = [
      {
        id: randomUUID(),
        text: "Historial de mensajes eliminado.",
        nickname: "System",
        timestamp: Date.now(),
        expiresAt: Date.now() + 2 * 60 * 1000 // 2 minutes
      }
    ];
    io.to(socket.roomId).emit("messagesUpdated", rooms[socket.roomId].messages);
  });

  socket.on("message", ({ recipientId, encryptedMessage }) => {
    const message = {
      id: randomUUID(),
      text: encryptedMessage,
      nickname: socket.nickname,
      timestamp: Date.now(),
      expiresAt: Date.now() + MESSAGE_EXPIRATION_TIME // 30 minutes
    };

    rooms[socket.roomId].messages.push(message);

    io.to(socket.roomId).emit("message", message);

    // Set message to expire in 30 minutes
    setTimeout(() => {
      rooms[socket.roomId].messages = rooms[socket.roomId].messages.filter(
        m => m.id !== message.id
      );
      io.to(socket.roomId).emit("messagesUpdated", rooms[socket.roomId].messages);
    }, MESSAGE_EXPIRATION_TIME);
  });

  socket.on("editMessage", data => {
    const { id, newText } = data;
    const message = rooms[socket.roomId].messages.find(
      m => m.id === id && m.nickname === socket.nickname
    );
    if (message) {
      message.text = newText;
      io.to(socket.roomId).emit("messagesUpdated", rooms[socket.roomId].messages);
    }
  });

  socket.on("deleteMessage", id => {
    const message = rooms[socket.roomId].messages.find(
      m => m.id === id && m.nickname === socket.nickname
    );
    if (message) {
      rooms[socket.roomId].messages = rooms[socket.roomId].messages.filter(
        m => m.id !== id
      );
      io.to(socket.roomId).emit("messagesUpdated", rooms[socket.roomId].messages);
    }
  });
});

httpServer.listen(port, () => {
  console.log(`Socket.IO server listening on http://localhost:${port}`);
});
