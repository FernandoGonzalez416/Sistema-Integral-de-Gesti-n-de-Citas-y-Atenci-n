import { Router } from 'express';
import {
  listarProfesionales,
  obtenerProfesional,
  crearProfesional,
  actualizarProfesional,
  desactivarProfesional
} from '../controllers/professionals.controller.js';
import { auth } from '../middlewares/auth.js';
import { permitir } from '../middlewares/roles.js';

const router = Router();

router.use(auth, permitir('ADMINISTRADOR', 'RECEPCIONISTA'));

router.get('/', listarProfesionales);
router.get('/:id', obtenerProfesional);
router.post('/', crearProfesional);
router.patch('/:id', actualizarProfesional);
router.patch('/:id/desactivar', desactivarProfesional);

export default router;