import { Router } from 'express';
import {
  listarPublico,
  listarTodas,
  obtener,
  crear,
  actualizar
} from '../controllers/publications.controller.js';
import { auth } from '../middlewares/auth.js';
import { permitir } from '../middlewares/roles.js';

const router = Router();

router.get('/', listarPublico);
router.get('/admin/todas', auth, permitir('ADMINISTRADOR'), listarTodas);
router.get('/:id', obtener);
router.post('/', auth, permitir('ADMINISTRADOR'), crear);
router.patch('/:id', auth, permitir('ADMINISTRADOR'), actualizar);

export default router;
