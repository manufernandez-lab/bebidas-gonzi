import { Router } from 'express';
import { getConfig, updateConfig } from '../controllers/controladorConfig.js';
import { validar } from '../middlewares/validar.js';
import { updateConfigSchema } from '../models/modeloConfig.js';

const router = Router();

router.get('/', getConfig);
router.put('/', validar(updateConfigSchema), updateConfig);

export default router;
