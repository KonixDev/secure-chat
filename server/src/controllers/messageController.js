const { randomUUID } = require("crypto");
const {
  addMessage,
  deleteMessage,
  editMessage,
  getRoom
} = require("../services/roomService");
const { MESSAGE_EXPIRATION_TIME } = require("../config");
const { encodeToBuffer } = require("../utils/cryptoUtils"); // Importa la función de codificación

const sendMessage = async (io, socket, dataBuff) => {
  const dataDecoded = dataBuff.data.participants;
  const data = {
    id: randomUUID(),
    text: dataDecoded,
    nickname: socket.nickname,
    timestamp: Date.now(),
    expiresAt: Date.now() + MESSAGE_EXPIRATION_TIME,
    type: dataBuff?.type || "text"
  };

  addMessage(socket.roomId, data);
  io.to(socket.roomId).emit("message", encodeToBuffer(data));

  setTimeout(() => {
    deleteMessage(socket.roomId, data.id);
    io
      .to(socket.roomId)
      .emit("messagesUpdated", encodeToBuffer(getRoom(socket.roomId).messages));
  }, MESSAGE_EXPIRATION_TIME);
};

const sendAudio =  async (io, socket, dataBuff) => {
  const dataDecoded = dataBuff.data.participants;
  const data = {
    id: randomUUID(),
    text: "",
    audio: dataDecoded,
    nickname: socket.nickname,
    timestamp: Date.now(),
    expiresAt: Date.now() + MESSAGE_EXPIRATION_TIME,
  };

  addMessage(socket.roomId, data);
  io.to(socket.roomId).emit("audio", encodeToBuffer(data));

  setTimeout(() => {
    deleteMessage(socket.roomId, data.id);
    io
      .to(socket.roomId)
      .emit("messagesUpdated", encodeToBuffer(getRoom(socket.roomId).messages));
  }, MESSAGE_EXPIRATION_TIME);
};

const handleEditMessage = async (io, socket, { id, newText }) => {
  const encryptedText = await socket.e2ee.encrypt(newText);
  editMessage(socket.roomId, id, encryptedText);
  io
    .to(socket.roomId)
    .emit("messagesUpdated", encodeToBuffer(getRoom(socket.roomId).messages));
};

const handleDeleteMessage = (io, socket, id) => {
  deleteMessage(socket.roomId, id);
  io
    .to(socket.roomId)
    .emit("messagesUpdated", encodeToBuffer(getRoom(socket.roomId).messages));
};

const handleClearMessages = (io, socket) => {
  clearMessages(socket.roomId);
  io
    .to(socket.roomId)
    .emit("messagesUpdated", encodeToBuffer(getRoom(socket.roomId).messages));
};

module.exports = {
  sendMessage,
  sendAudio,
  handleEditMessage,
  handleDeleteMessage,
  handleClearMessages
};