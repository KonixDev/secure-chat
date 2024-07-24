const {
  getPublicKeys,
  addPublicKey,
} = require("../services/keyService");
const { createRoom, getRoom } = require('../services/roomService');
const { encodeToBuffer } = require("../utils/cryptoUtils");

const handleAuthentication = async (socket, io, { masterKey, nickname, roomId }) => {
  socket.nickname = nickname;
  socket.roomId = roomId;
  socket.join(roomId);

  createRoom(roomId);

  const room = getRoom(roomId);
  room.sockets.push(socket);
  socket.emit("authenticated");
  console.log(`${nickname} connected to room ${roomId}`);
  const publicKeys = encodeToBuffer(getPublicKeys(socket.roomId))
  io.to(socket.roomId).emit("publicKeys", publicKeys);

  setTimeout(() => {
    const initMessages = getRoom(socket.roomId)?.messages || [];
    socket.emit('roomMessages', encodeToBuffer(initMessages));
  }, 1000);
};

const handleSharePublicKey = async (socket, io, { publicKey, nickname }) => {
  // No need to add the public key on the server side.
  addPublicKey(socket.roomId, nickname, publicKey);
  const publicKeys = getPublicKeys(socket.roomId);
  io.to(socket.roomId).emit("publicKeys", encodeToBuffer(publicKeys));
};

const handleDisconnect = (socket, io) => {
  const room = getRoom(socket.roomId);
  if (!room || !room.sockets) return;
  room.sockets = room.sockets.filter(s => s.id !== socket.id);
  io.to(socket.roomId).emit("publicKeys", encodeToBuffer(getPublicKeys(socket.roomId)));
  console.log(`${socket.nickname} disconnected from room ${socket.roomId}`);
};

module.exports = {
  handleAuthentication,
  handleSharePublicKey,
  handleDisconnect
};