const { createRoom, getRoom } = require("../services/roomService");
const {
  addPublicKey,
  getPublicKeys,
  removePublicKey
} = require("../services/keyService");

const handleAuthentication = (socket, { masterKey, nickname, roomId }) => {
  socket.nickname = nickname;
  socket.roomId = roomId;
  socket.join(roomId);

  createRoom(roomId);

  socket.emit("authenticated");
  console.log(`${nickname} connected to room ${roomId}`);
};

const handleSharePublicKey = (socket, io, { publicKey }) => {
  addPublicKey(socket.nickname, publicKey);
  io.emit("publicKeys", getPublicKeys());
};

const handleDisconnect = (socket, io) => {
  removePublicKey(socket.nickname);
  io.emit("publicKeys", getPublicKeys());
  console.log(`${socket.nickname} disconnected from room ${socket.roomId}`);
};

module.exports = {
  handleAuthentication,
  handleSharePublicKey,
  handleDisconnect
};
