const { SECRET_KEY, IV, ALGORITHM } = require("../config");
const crypto = require("crypto");

const encrypt = buffer => {
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(SECRET_KEY, "hex"),
    Buffer.from(IV, "hex")
  );
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return encrypted;
};

const decrypt = buffer => {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(SECRET_KEY, "hex"),
    Buffer.from(IV, "hex")
  );
  const decrypted = Buffer.concat([decipher.update(buffer), decipher.final()]);
  return decrypted;
};

// Función para codificar datos con TextEncoder y encriptar
const encodeToBuffer = data => {
  const jsonString = JSON.stringify(data);
  const encoded = new TextEncoder().encode(jsonString);
  const encrypted = encrypt(encoded);
  return encrypted;
};

// Función para decodificar y desencriptar datos con TextDecoder
const decodeFromBuffer = buffer => {
  return JSON.parse(new TextDecoder().decode(buffer));
};

module.exports = {
  encodeToBuffer,
  decodeFromBuffer,
  decrypt
};
