const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  PORT: process.env.PORT || 4000,
  MASTER_KEY: process.env.MASTER_KEY || "asd",
  MESSAGE_EXPIRATION_TIME:
    process.env.MESSAGE_EXPIRATION_TIME_IN_MINUTES * 60 * 1000 || 30 * 60 * 1000
};
