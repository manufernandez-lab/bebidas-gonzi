import { z } from 'zod';

export const modeloProductoSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'El nombre es requerido'),
  price: z.number().positive('El precio debe ser mayor a 0'),
  category: z.string().min(1, 'La categoría es requerida'),
  imageUrl: z.string().min(1, 'La imagen es requerida'),
  isAvailable: z.boolean().default(true)
});
