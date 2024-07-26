const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { PORT, SECRET_KEY, IV } = require("./config");
const authMiddleware = require("./middlewares/authMiddleware");
const {
  handleAuthentication,
  handleSharePublicKey,
  handleDisconnect
} = require("./controllers/authController");
const {
  sendMessage,
  handleEditMessage,
  handleDeleteMessage,
  handleClearMessages,
  sendAudio
} = require("./controllers/messageController");
const {
  decrypt,
} = require("./utils/cryptoUtils");

const options = {};

const app = express();
const httpsServer = http.createServer(options, app);

const io = new Server(httpsServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  maxHttpBufferSize: 1e8,
  pingTimeout: 60000,
});

// Middleware para transformar y desencriptar datos binarios
io.use((socket, next) => {
  socket.use((packet, next) => {
    if (packet.length > 1 && Buffer.isBuffer(packet[1])) {
      let decodedData = decrypt(packet[1]);
      if (packet[0] === "authenticate") {
        decodedData = JSON.parse(
          new TextDecoder().decode(packet[1]).toString()
        );
        packet[1] = decodedData;
        return next();
      }
      packet[1] = JSON.parse(decodedData.toString());
    }
    next();
  });
  next();
});

io.use(authMiddleware);

io.on("connection", socket => {
  socket.on("disconnect", () => handleDisconnect(socket, io));

  socket.on("sharePublicKey", data => handleSharePublicKey(socket, io, data));

  socket.on("authenticate", data => handleAuthentication(socket, io, data));

  socket.on("clearMessages", () => handleClearMessages(io, socket));

  socket.on("message", data => sendMessage(io, socket, data));

  socket.on("audioMessage", data => sendAudio(io, socket, data));

  socket.on("editMessage", data => handleEditMessage(io, socket, data));

  socket.on("deleteMessage", id => handleDeleteMessage(io, socket, id));

  socket.on("typing", () => {
    io.to(socket.roomId).emit("userTyping", socket.nickname);
  });

  socket.on("stopTyping", () => {
    io.to(socket.roomId).emit("userStopTyping", socket.nickname);
  });

  socket.on("join-room-call", () => {
    io.to(socket.roomId).emit("server-call-joined", {
      userId: socket.id,
      nickname: socket.nickname,
      roomId: socket.roomId
    });
  });

  socket.on("leave-room-call", () => {
    io
      .to(socket.roomId)
      .emit("server-call-left", {
        userId: socket.id,
        nickname: socket.nickname,
        roomId: socket.roomId
      });
  });

  socket.on("audioStream", audioData => {
    socket.broadcast.emit("audioStream", audioData);
  });

  socket.emit("keys", {
    SECRET_KEY,
    IV
  });
});

httpsServer.listen(PORT, () => {
  console.log(`Socket.IO server listening on http://localhost:${PORT}`);
});
