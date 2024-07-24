let publicKeys = {};

const addPublicKey = (roomId, socketId, publicKey) => {
  if (!publicKeys[roomId]) {
    publicKeys[roomId] = {};
  }
  publicKeys[roomId][socketId] = publicKey;
};

const getPublicKeys = roomId => {
  return publicKeys[roomId] || {};
};

const removePublicKey = (roomId, socketId) => {
  if (publicKeys[roomId]) {
    delete publicKeys[roomId][socketId];
  }
};

module.exports = {
  addPublicKey,
  getPublicKeys,
  removePublicKey
};
