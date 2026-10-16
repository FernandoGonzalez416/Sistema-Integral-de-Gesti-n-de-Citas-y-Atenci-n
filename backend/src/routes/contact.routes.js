import { Router } from 'express';
import { crear, listar, marcar } from '../controllers/contact.controller.js';
import { auth } from '../middlewares/auth.js';
import { permitir } from '../middlewares/roles.js';

const router = Router();

router.post('/', crear);
router.get('/', auth, permitir('ADMINISTRADOR'), listar);
router.patch('/:id', auth, permitir('ADMINISTRADOR'), marcar);

export default router;
