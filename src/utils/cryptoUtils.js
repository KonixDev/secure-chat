"use client";

// Función para codificar datos con TextEncoder y encriptar
export const encodeToBuffer = async ({data, secret = '', iv = ''}) => {
  const jsonString = JSON.stringify(data);
  let encoded = new TextEncoder().encode(jsonString);
  if (iv && secret) {
    encoded = await encrypt(encoded, secret, iv);
  }
  return encoded;
};

// Función para decodificar y desencriptar datos con TextDecoder
export const decodeFromBuffer = async ({buffer, iv = '', secret = ''}) => {
  if (iv && secret) {
    buffer = await decrypt(buffer, secret, iv);
  }
  const jsonString = new TextDecoder().decode(buffer);
  return JSON.parse(jsonString);
};

// Función para encriptar datos
export const encrypt = async (buffer, secretKey, iv) => {
  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    secretKey,
    { name: 'AES-CTR' },
    false,
    ['encrypt']
  );

  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: 'AES-CTR',
      counter: iv,
      length: 128 // 128 bits = 16 bytes
    },
    cryptoKey,
    buffer
  );
  return new Uint8Array(encrypted);
};

// Función para desencriptar datos
export const decrypt = async (buffer, secretKey, iv) => {
  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    secretKey,
    { name: 'AES-CTR' },
    false,
    ['decrypt']
  );

  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: 'AES-CTR',
      counter: iv,
      length: 128
    },
    cryptoKey,
    buffer
  );

  return new Uint8Array(decrypted);
};


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
