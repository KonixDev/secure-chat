const { randomUUID } = require("crypto");
const { MESSAGE_EXPIRATION_TIME } = require("../config");
const {
  addMessage,
  deleteMessage,
  editMessage,
  getRoom
} = require("../services/roomService");

const sendMessage = (io, socket, { recipientId, messageData }) => {
  const message = {
    id: randomUUID(),
    text: messageData,
    nickname: socket.nickname,
    timestamp: Date.now(),
    expiresAt: Date.now() + MESSAGE_EXPIRATION_TIME
  };

  addMessage(socket.roomId, message);
  io.to(socket.roomId).emit("message", message);

  setTimeout(() => {
    deleteMessage(socket.roomId, message.id);
    io
      .to(socket.roomId)
      .emit("messagesUpdated", getRoom(socket.roomId).messages);
  }, MESSAGE_EXPIRATION_TIME);
};

const handleEditMessage = (io, socket, { id, newText }) => {
  editMessage(socket.roomId, id, newText);
  io.to(socket.roomId).emit("messagesUpdated", getRoom(socket.roomId).messages);
};

const handleDeleteMessage = (io, socket, id) => {
  deleteMessage(socket.roomId, id);
  io.to(socket.roomId).emit("messagesUpdated", getRoom(socket.roomId).messages);
};

const handleClearMessages = (io, socket) => {
  clearMessages(socket.roomId);
  io.to(socket.roomId).emit("messagesUpdated", getRoom(socket.roomId).messages);
};

module.exports = {
  sendMessage,
  handleEditMessage,
  handleDeleteMessage,
  handleClearMessages
};
