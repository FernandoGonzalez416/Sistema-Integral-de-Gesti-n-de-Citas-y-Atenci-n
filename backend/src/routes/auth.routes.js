import { Router } from 'express';
import { login, registrar, me, actualizarPerfil, cambiarPassword } from '../controllers/auth.controller.js';
import { auth } from '../middlewares/auth.js';

const router = Router();

router.post('/login', login);
router.post('/register', registrar); // público: solo crea usuarios CLIENTE
router.get('/me', auth, me);
router.patch('/perfil', auth, actualizarPerfil); // cualquier rol, solo sobre su propia cuenta
router.patch('/password', auth, cambiarPassword);

export default router;