"use client";

import { E2EE } from "e2ee.js";

const LOCAL_STORAGE_KEY = "e2ee_keypair";
const DB_NAME = "e2eeDatabase";
const STORE_NAME = "keys";

// Contraseña fija y compleja
const FIXED_PASSWORD = "aVeryComplexPassword!@#$%^&*()_+";

const deriveEncryptionKey = async (password) => {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode("some_salt"), // Usar un salt seguro
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
};

// Abre o crea la base de datos IndexedDB
const openDatabase = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore(STORE_NAME, { keyPath: 'id' });
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

// Generar un IV del tamaño adecuado para AES-GCM
const generateIv = () => {
  return window.crypto.getRandomValues(new Uint8Array(12)); // 12 bytes para AES-GCM
};

// Cifrar y almacenar una clave en IndexedDB
const storeEncryptedKey = async (key, password) => {
  const enc = new TextEncoder();
  const encryptionKey = await deriveEncryptionKey(password);
  const iv = generateIv();

  const encryptedKey = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv
    },
    encryptionKey,
    enc.encode(JSON.stringify(key))
  );

  const db = await openDatabase();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  await store.put({ id: LOCAL_STORAGE_KEY, key: Array.from(new Uint8Array(encryptedKey)), iv: Array.from(iv) });
};

// Recuperar y descifrar una clave desde IndexedDB
const getDecryptedKey = async (password) => {
  const enc = new TextEncoder();
  const encryptionKey = await deriveEncryptionKey(password);
  const db = await openDatabase();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.get(LOCAL_STORAGE_KEY);

    request.onsuccess = async (event) => {
      const storedKey = event.target.result;
      if (!storedKey) {
        resolve(null);
        return;
      }

      try {
        const decryptedKey = await window.crypto.subtle.decrypt(
          {
            name: "AES-GCM",
            iv: new Uint8Array(storedKey.iv)
          },
          encryptionKey,
          new Uint8Array(storedKey.key)
        );
        resolve(JSON.parse(new TextDecoder().decode(decryptedKey)));
      } catch (error) {
        reject(error);
      }
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

export const initializeE2EE = async () => {
  let clientInstanceE2EE = new E2EE();
  const storedKeyPair = await getDecryptedKey(FIXED_PASSWORD).catch(err => {
    console.error("Error retrieving key pair:", err);
    return null;
  });

  if (storedKeyPair) {
    await clientInstanceE2EE.importKeyPair(storedKeyPair);
  } else {
    await clientInstanceE2EE.generateKeyPair({ extractable: true });
    const exportedKeyPair = {
      privateKey: await clientInstanceE2EE.exportPrivateKey(),
      publicKey: await clientInstanceE2EE.exportPublicKey()
    };
    await storeEncryptedKey(exportedKeyPair, FIXED_PASSWORD);
  }

  return clientInstanceE2EE;
};

export const clearStoredKeyPair = async () => {
  const db = await openDatabase();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  await store.delete(LOCAL_STORAGE_KEY);
};
