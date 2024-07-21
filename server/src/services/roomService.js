let rooms = {};

const getRoom = (roomId) => rooms[roomId];

const createRoom = (roomId) => {
  if (!rooms[roomId]) {
    rooms[roomId] = {
      messages: [],
      roomId: roomId,
    };
  }
  return rooms[roomId];
};

const addMessage = (roomId, message) => {
  rooms[roomId].messages.push(message);
};

const clearMessages = (roomId) => {
  rooms[roomId].messages = [
    {
      id: crypto.randomUUID(),
      text: "Historial de mensajes eliminado.",
      nickname: "System",
      timestamp: Date.now(),
      expiresAt: Date.now() + 2 * 60 * 1000 // 2 minutos
    }
  ];
};

const deleteMessage = (roomId, messageId) => {
  rooms[roomId].messages = rooms[roomId].messages.filter(m => m.id !== messageId);
};

const editMessage = (roomId, messageId, newText) => {
  const message = rooms[roomId].messages.find(m => m.id === messageId);
  if (message) {
    message.text = newText;
  }
};

module.exports = {
  getRoom,
  createRoom,
  addMessage,
  clearMessages,
  deleteMessage,
  editMessage
};
