import { Router } from 'express';
import { crear, listar, contador, marcar } from '../controllers/contact.controller.js';
import { auth } from '../middlewares/auth.js';
import { permitir } from '../middlewares/roles.js';

const router = Router();

router.post('/', crear);
router.get('/', auth, permitir('ADMINISTRADOR'), listar);
router.get('/contador', auth, permitir('ADMINISTRADOR'), contador);
router.patch('/:id', auth, permitir('ADMINISTRADOR'), marcar);

export default router;
