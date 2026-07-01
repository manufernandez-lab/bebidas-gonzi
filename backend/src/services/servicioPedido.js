import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { servicioProducto } from './servicioProducto.js';
import { ErrorAplicacion } from '../utils/errorAplicacion.js';
import { isMongoConnected, OrderModel } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(__dirname, '../data/orders.json');

const initData = async () => {
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    try {
      await fs.access(filePath);
    } catch {
      await fs.writeFile(filePath, JSON.stringify([], null, 2));
    }
  } catch (error) {
    console.error('Error al inicializar la base de datos de pedidos:', error);
  }
};

await initData();

export const servicioPedido = {
  async getAll() {
    if (isMongoConnected()) {
      return await OrderModel.find().sort({ createdAt: -1 }).lean();
    }
    const data = await fs.readFile(filePath, 'utf-8');
    const orders = JSON.parse(data);
    return orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async getById(id) {
    if (isMongoConnected()) {
      return await OrderModel.findOne({ id }).lean();
    }
    const orders = await this.getAll();
    return orders.find(o => o.id === id);
  },

  async create(orderData) {
    const products = await servicioProducto.getAll();
    const orderItems = [];
    let totalAmount = 0;

    for (const item of orderData.items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        throw new ErrorAplicacion(`El producto con ID ${item.productId} no existe`, 404);
      }
      if (!product.isAvailable) {
        throw new ErrorAplicacion(`El producto ${product.name} no está disponible actualmente`, 400);
      }
      const subtotal = product.price * item.quantity;
      totalAmount += subtotal;
      const name = item.flavor ? `${product.name} (${item.flavor})` : product.name;
      orderItems.push({
        productId: product.id,
        name,
        price: product.price,
        quantity: item.quantity,
        subtotal
      });
    }

    const newOrder = {
      id: crypto.randomUUID(),
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      deliveryAddress: orderData.deliveryAddress,
      lat: orderData.lat,
      lng: orderData.lng,
      paymentMethod: orderData.paymentMethod,
      items: orderItems,
      totalAmount,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    if (isMongoConnected()) {
      const doc = new OrderModel(newOrder);
      await doc.save();
      return doc.toObject();
    }

    const orders = await this.getAll();
    orders.push(newOrder);
    await fs.writeFile(filePath, JSON.stringify(orders, null, 2));

    return newOrder;
  },

  async updateStatus(id, status) {
    if (isMongoConnected()) {
      const doc = await OrderModel.findOneAndUpdate({ id }, { status }, { new: true }).lean();
      return doc;
    }

    const orders = await this.getAll();
    const index = orders.findIndex(o => o.id === id);
    if (index === -1) return null;

    orders[index].status = status;
    await fs.writeFile(filePath, JSON.stringify(orders, null, 2));
    return orders[index];
  }
};
