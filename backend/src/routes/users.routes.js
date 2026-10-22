import { Router } from 'express';
import { listar, crear, obtener, actualizar, restablecerPassword } from '../controllers/users.controller.js';
import { auth } from '../middlewares/auth.js';
import { permitir } from '../middlewares/roles.js';

const router = Router();

// Todo el módulo exige ADMINISTRADOR activo.
router.use(auth, permitir('ADMINISTRADOR'));

router.get('/', listar);
router.post('/', crear);
router.get('/:id', obtener);
router.put('/:id', actualizar);
router.patch('/:id/restablecer-password', restablecerPassword);

export default router;
