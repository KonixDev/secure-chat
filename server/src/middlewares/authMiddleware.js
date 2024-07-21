const { MASTER_KEY } = require("../config");

const authMiddleware = (socket, next) => {
  const { masterKey, nickname, roomId } = socket.handshake.auth;
  if (masterKey === MASTER_KEY && nickname && roomId) {
    socket.nickname = nickname;
    socket.roomId = roomId;
    return next();
  }
  return next(new Error("authentication error"));
};

module.exports = authMiddleware;
