import { servicioPedido } from '../services/servicioPedido.js';
import { ErrorAplicacion } from '../utils/errorAplicacion.js';

export const createOrder = async (req, res, next) => {
  try {
    const newOrder = await servicioPedido.create(req.body);
    
    res.status(201).json({
      status: 'success',
      data: { order: newOrder }
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await servicioPedido.getById(id);

    if (!order) {
      return next(new ErrorAplicacion('Pedido no encontrado', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { order }
    });
  } catch (error) {
    next(error);
  }
};

export const getAllOrders = async (req, res, next) => {
  try {
    const orders = await servicioPedido.getAll();
    res.status(200).json({
      status: 'success',
      results: orders.length,
      data: { orders }
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return next(new ErrorAplicacion('El estado del pedido es requerido', 400));
    }

    const updated = await servicioPedido.updateStatus(id, status);
    
    if (!updated) {
      return next(new ErrorAplicacion('Pedido no encontrado', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { order: updated }
    });
  } catch (error) {
    next(error);
  }
};
