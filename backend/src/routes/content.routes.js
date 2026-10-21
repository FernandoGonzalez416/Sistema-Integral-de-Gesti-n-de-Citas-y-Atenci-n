import { Router } from 'express';
import {
  listarPublico,
  obtenerPorClave,
  listarTodos,
  crear,
  actualizar
} from '../controllers/content.controller.js';
import { auth } from '../middlewares/auth.js';
import { permitir } from '../middlewares/roles.js';

const router = Router();

router.get('/', listarPublico);
router.get('/admin/todos', auth, permitir('ADMINISTRADOR'), listarTodos);
router.get('/:clave', obtenerPorClave);
router.post('/', auth, permitir('ADMINISTRADOR'), crear);
router.put('/:id', auth, permitir('ADMINISTRADOR'), actualizar);

export default router;
