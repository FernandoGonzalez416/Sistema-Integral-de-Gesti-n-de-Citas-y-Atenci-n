import { Router } from 'express';
import {
  listarPacientes,
  obtenerPaciente,
  crearPaciente,
  actualizarPaciente,
  cambiarEstadoPaciente
} from '../controllers/patients.controller.js';
import { auth } from '../middlewares/auth.js';
import { permitir } from '../middlewares/roles.js';

const router = Router();

// Todas requieren autenticación y rol ADMINISTRADOR o RECEPCIONISTA.
router.use(auth, permitir('ADMINISTRADOR', 'RECEPCIONISTA'));

router.get('/', listarPacientes);
router.get('/:id', obtenerPaciente);
router.post('/', crearPaciente);
router.put('/:id', actualizarPaciente);
router.patch('/:id/estado', cambiarEstadoPaciente);

export default router;
