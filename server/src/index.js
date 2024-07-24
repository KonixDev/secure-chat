const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { PORT } = require('./config');
const authMiddleware = require('./middlewares/authMiddleware');
const { handleAuthentication, handleSharePublicKey, handleDisconnect } = require('./controllers/authController');
const { sendMessage, handleEditMessage, handleDeleteMessage, handleClearMessages } = require('./controllers/messageController');
const { getRoom } = require('./services/roomService');

const options = {};

const app = express();
const httpsServer = http.createServer(options, app);

const io = new Server(httpsServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.use(authMiddleware);

io.on('connection', socket => {
  socket.on('disconnect', () => handleDisconnect(socket, io));

  socket.on('sharePublicKey', data => handleSharePublicKey(socket, io, data));

  socket.on('authenticate', data => handleAuthentication(socket, io, data));

  socket.on('clearMessages', () => handleClearMessages(io, socket));

  socket.on('message', data => sendMessage(io, socket, data));

  socket.on('editMessage', data => handleEditMessage(io, socket, data));

  socket.on('deleteMessage', id => handleDeleteMessage(io, socket, id));
});

httpsServer.listen(PORT, () => {
  console.log(`Socket.IO server listening on http://localhost:${PORT}`);
});
