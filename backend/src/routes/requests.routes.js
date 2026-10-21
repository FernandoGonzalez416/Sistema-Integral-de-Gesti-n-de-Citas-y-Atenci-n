import { Router } from 'express';
import { crear, listar, cambiarEstado } from '../controllers/requests.controller.js';
import { auth } from '../middlewares/auth.js';
import { permitir } from '../middlewares/roles.js';

const router = Router();

router.post('/', crear);
router.get('/', auth, permitir('ADMINISTRADOR', 'RECEPCIONISTA'), listar);
router.patch('/:id/estado', auth, permitir('ADMINISTRADOR', 'RECEPCIONISTA'), cambiarEstado);

export default router;
