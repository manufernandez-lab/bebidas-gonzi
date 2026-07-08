import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import rutasProducto from './routes/rutasProducto.js';
import rutasPedido from './routes/rutasPedido.js';
import rutasConfig from './routes/rutasConfig.js';
import { manejadorErrores } from './middlewares/manejadorErrores.js';
import { ErrorAplicacion } from './utils/errorAplicacion.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Servir archivos estáticos subidos con caché de 30 días
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  maxAge: '30d',
  etag: true
}));

app.use('/api/products', rutasProducto);
app.use('/api/orders', rutasPedido);
app.use('/api/config', rutasConfig);

app.use((req, res, next) => {
  next(new ErrorAplicacion(`No se pudo encontrar la ruta ${req.originalUrl} en este servidor.`, 404));
});

app.use(manejadorErrores);

export default app;
