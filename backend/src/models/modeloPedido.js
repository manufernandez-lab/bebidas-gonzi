import { z } from 'zod';

const itemPedidoSchema = z.object({
  productId: z.string().uuid('ID de producto no válido'),
  quantity: z.number().int().positive('La cantidad debe ser mayor a 0'),
  flavor: z.string().optional()
});

export const crearPedidoSchema = z.object({
  customerName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  customerPhone: z.string().optional(),
  deliveryAddress: z.string().min(5, 'La dirección debe tener al menos 5 caracteres'),
  notes: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  paymentMethod: z.enum(['cash', 'transfer'], {
    errorMap: () => ({ message: 'Método de pago no válido (cash, transfer)' })
  }),
  items: z.array(itemPedidoSchema).min(1, 'Debe incluir al menos un producto en el pedido')
});
