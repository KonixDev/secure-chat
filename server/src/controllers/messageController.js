const { randomUUID } = require("crypto");
const {
  addMessage,
  deleteMessage,
  editMessage,
  getRoom
} = require("../services/roomService");
const { MESSAGE_EXPIRATION_TIME } = require("../config");
const { getPublicKeys } = require("../services/keyService");

const sendMessage = async (io, socket, { participants }) => {
  const data = {
    id: randomUUID(),
    text: participants,
    nickname: socket.nickname,
    timestamp: Date.now(),
    expiresAt: Date.now() + MESSAGE_EXPIRATION_TIME
  };

  addMessage(socket.roomId, data);
  io.to(socket.roomId).emit("message", data);

  setTimeout(() => {
    deleteMessage(socket.roomId, data.id);
    io.to(socket.roomId).emit("messagesUpdated", getRoom(socket.roomId).messages);
  }, MESSAGE_EXPIRATION_TIME);
};

const handleEditMessage = async (io, socket, { id, newText }) => {
  const encryptedText = await socket.e2ee.encrypt(newText);
  editMessage(socket.roomId, id, encryptedText);
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
