import { Router } from 'express';
import {
  listarPublico,
  listarTodos,
  crear,
  actualizar,
  eliminar
} from '../controllers/carousel.controller.js';
import { auth } from '../middlewares/auth.js';
import { permitir } from '../middlewares/roles.js';

const router = Router();

router.get('/', listarPublico);
router.get('/admin/todos', auth, permitir('ADMINISTRADOR'), listarTodos);
router.post('/', auth, permitir('ADMINISTRADOR'), crear);
router.put('/:id', auth, permitir('ADMINISTRADOR'), actualizar);
router.delete('/:id', auth, permitir('ADMINISTRADOR'), eliminar);

export default router;
