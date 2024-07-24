const dotenv = require("dotenv");
const crypto = require("crypto");

dotenv.config();
const secretKey = crypto.randomBytes(32).toString("hex"); // Converted to hex for transmission
const iv = crypto.randomBytes(16).toString("hex"); // Converted to hex for transmission
const algorithm = 'aes-256-ctr';

module.exports = {
  PORT: process.env.PORT || 4000,
  MASTER_KEY: process.env.MASTER_KEY || "asd",
  ALGORITHM: algorithm,
  SECRET_KEY: secretKey,
  IV: iv,
  MESSAGE_EXPIRATION_TIME:
    process.env.MESSAGE_EXPIRATION_TIME_IN_MINUTES * 60 * 1000 || 30 * 60 * 1000
};
