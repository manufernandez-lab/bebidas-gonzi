import dotenv from 'dotenv';
import { connectDB } from './config/db.js';

dotenv.config();

// Connect to MongoDB (with fallback to local JSON DB) before initializing the app
await connectDB();

const { default: app } = await import('./aplicacion.js');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en el puerto http://localhost:${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.error('💥 RECHAZO DE PROMESA NO MANEJADO! Apagando el servidor...');
  console.error(err.name, err.message, err.stack);
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (err) => {
  console.error('💥 EXCEPCIÓN NO CONTROLADA! Apagando el servidor...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});
