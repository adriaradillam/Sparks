import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes';
import { checkConnection } from './db';

import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';

// Servir archivos estáticos y fotos subidas
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Documentación interactiva Swagger / OpenAPI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Usar nuestras rutas
app.use('/api', apiRoutes);

// Ruta de prueba
app.get('/api/ping', (req, res) => {
  res.json({
    message: '¡El servidor backend está funcionando perfectamente!',
    docs: 'http://localhost:5000/api/docs'
  });
});

app.listen(PORT, async () => {
  console.log(`Servidor corriendo en la ruta http://localhost:${PORT}`);
  await checkConnection(); // Comprueba la base de datos al iniciar
});
