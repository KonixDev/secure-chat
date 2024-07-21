let publicKeys = {};

const addPublicKey = (socketId, publicKey) => {
  publicKeys[socketId] = publicKey;
};

const removePublicKey = (socketId) => {
  delete publicKeys[socketId];
};

const getPublicKeys = () => publicKeys;

module.exports = {
  addPublicKey,
  removePublicKey,
  getPublicKeys
};
