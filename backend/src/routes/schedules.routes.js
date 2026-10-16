import { Router } from 'express';
import { listarPublico, listarTodos, crear, actualizar } from '../controllers/schedules.controller.js';
import { auth } from '../middlewares/auth.js';
import { permitir } from '../middlewares/roles.js';

const router = Router();

router.get('/', listarPublico);
router.get('/admin/todos', auth, permitir('ADMINISTRADOR'), listarTodos);
router.post('/', auth, permitir('ADMINISTRADOR'), crear);
router.patch('/:id', auth, permitir('ADMINISTRADOR'), actualizar);

export default router;
