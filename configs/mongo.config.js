// configs/mongo.config.js
const mongoose = require('mongoose');
const { env } = require('./env.config');

class MongoService {
    constructor() {
        this.mongoURI = env.mongo.MONGO_URI;
    }

    async connect() {
        try {
            await mongoose.connect(this.mongoURI);
            console.log("✓ Conexión exitosa con MongoDB");
        } catch (error) {
            console.error("✗ Error al conectar con MongoDB", error.message);
            throw error;
        }
    }

    async disconnect() {
        try {
            await mongoose.disconnect();
            console.log("✓ Desconexión exitosa de MongoDB");
        } catch (error) {
            console.error("✗ Error al desconectar MongoDB", error.message);
            throw error;
        }
    }

    getConnection() {
        return mongoose.connection;
    }

    isConnected() {
        return mongoose.connection.readyState === 1;
    }
}

// Crear una instancia única del servicio MongoDB
const mongoService = new MongoService();

module.exports = mongoService;
