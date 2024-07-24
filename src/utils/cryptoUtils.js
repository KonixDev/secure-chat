"use client";

export const handleMessages = async (messages, clientInstanceE2EE, nickname) => {
  const result = await Promise.all(
    messages.map(async (m) => {
      try {
        const decryptedMessages = await Promise.all(
          m.text.map(async (p) => {
            const decryptedMessage = await clientInstanceE2EE.decrypt(p.message, m.nickname);
            return { nickname: p.nickname, message: decryptedMessage };
          })
        );

        const message = decryptedMessages.find((p) => p.nickname === nickname)?.message || "[Encrypted message]";
        return { ...m, text: message };
      } catch (error) {
        console.error("Decryption failed:", error);
        return { ...m, text: "[Encrypted message]" };
      }
    })
  );
  return result;
};

export const encryptMessageToAllParticipants = async (message, participants, clientInstanceE2EE) => {
  return await Promise.all(
    Object.entries(participants).map(async ([key]) => {
      const encryptedMessage = await clientInstanceE2EE.encrypt(message, key);
      return { nickname: key, message: encryptedMessage };
    })
  );
};

export const setRemotePublicKeys = async (clientInstanceE2EE, publicKeys) => {
  const setKeysPromises = Object.entries(publicKeys).map(([key, value]) =>
    clientInstanceE2EE.setRemotePublicKey(value, key)
  );
  await Promise.all(setKeysPromises);
};
