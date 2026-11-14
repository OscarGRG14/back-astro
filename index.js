const express = require('express');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');

// Configuraciones
const { env } = require('./configs/env.config');

// Base de Datos
const mongoService = require('./configs/mongo.config');

// Middlewares
const { errorHandler, notFound } = require('./middlewares/error.middleware');

// Rutas
const Routes = require('./routes/routes');

// Documentación OpenAPI
const openapi = require('./docs/openapi.json');

// Configuración de la aplicación
const app = express();
app.use(cors());

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));
app.use(morgan('dev'));

// Documentación interactiva (para demo sin frontend)
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapi));

// Rutas
app.use('/api', Routes);

// Manejo de errores
app.use(notFound);
app.use(errorHandler);

// Tiempo real (Socket.IO) sobre el mismo puerto HTTP
const socketService = require('./services/socket.service');

// Conexión a base de datos y arranque del servidor
mongoService.connect()
    .then(() => {
        const server = http.createServer(app);
        socketService.init(server);
        server.listen(env.server.PORT, () => {
            console.log(`✓ Servidor corriendo en el puerto ${env.server.PORT}`);
            console.log(`✓ Documentación en http://localhost:${env.server.PORT}/api/docs`);
            console.log(`✓ WebSockets (Socket.IO) activos`);
        });
    })
    .catch((err) => {
        console.error('✗ No se pudo conectar a MongoDB. Servidor no iniciado.', err.message);
        process.exit(1);
    });
