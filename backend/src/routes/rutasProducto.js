import { Router } from 'express';
import { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../controllers/controladorProducto.js';
import { validar } from '../middlewares/validar.js';
import { modeloProductoSchema } from '../models/modeloProducto.js';

const router = Router();

router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.post('/', validar(modeloProductoSchema), createProduct);
router.put('/:id', validar(modeloProductoSchema), updateProduct);
router.delete('/:id', deleteProduct);

export default router;
