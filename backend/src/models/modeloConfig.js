import { z } from 'zod';

const itemScheduleSchema = z.object({
  dayIndex: z.number().int().min(0).max(6),
  dayName: z.string(),
  isOpen: z.boolean(),
  openTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)'),
  closeTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)')
});

export const updateConfigSchema = z.object({
  schedule: z.array(itemScheduleSchema).length(7, 'El cronograma debe incluir exactamente los 7 días de la semana')
});
