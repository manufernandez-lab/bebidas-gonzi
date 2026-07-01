import { Router } from 'express';
import { createOrder, getOrderById, getAllOrders, updateOrderStatus } from '../controllers/controladorPedido.js';
import { validar } from '../middlewares/validar.js';
import { crearPedidoSchema } from '../models/modeloPedido.js';

const router = Router();

router.get('/', getAllOrders);
router.post('/', validar(crearPedidoSchema), createOrder);
router.get('/:id', getOrderById);
router.patch('/:id/status', updateOrderStatus);

export default router;
