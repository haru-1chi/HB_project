const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  PORT: process.env.PORT,
  URI: process.env.URI,
  SECRET_ACCESS_TOKEN: process.env.SECRET_ACCESS_TOKEN,
  BASE_URL: process.env.BASE_URL,
  HOST: process.env.HOST,
  SERVICE: process.env.SERVICE,
  EMAIL_PORT: process.env.EMAIL_PORT,
  SECURE: process.env.SECURE,
  USER: process.env.USER,
  PASSWORD: process.env.PASSWORD,
  CONNECT: process.env.CONNECT,
};
