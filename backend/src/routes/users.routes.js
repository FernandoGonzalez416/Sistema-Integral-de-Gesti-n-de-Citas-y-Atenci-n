import { Router } from 'express';
import { listar, crear, obtener, actualizar } from '../controllers/users.controller.js';
import { auth } from '../middlewares/auth.js';
import { permitir } from '../middlewares/roles.js';

const router = Router();

// Todo el módulo exige ADMINISTRADOR activo.
router.use(auth, permitir('ADMINISTRADOR'));

router.get('/', listar);
router.post('/', crear);
router.get('/:id', obtener);
router.put('/:id', actualizar);

export default router;
