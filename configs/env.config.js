// configs/env.config.js
require("dotenv").config();

const env = {
    // Servidor
    server: {
        PORT: process.env.PORT,
    },

    // MongoDB
    mongo: {
        MONGO_URI: process.env.MONGO_URI,
    },

    // JWT
    jwt: {
        JWT_SECRET: process.env.JWT_SECRET,
        JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '2d',
    },

    // Gemini
    gemini: {
        GEMINI_API_KEY: process.env.GEMINI_API_KEY,
        GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.5-flash'
    },
};

module.exports = { env };