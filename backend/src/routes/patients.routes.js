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

router.use(auth);

// PROFESIONAL solo lee los datos básicos de los pacientes con cita con él;
// el controlador aplica ese filtro. La gestión sigue siendo de ADMIN/RECEP.
const lectura = permitir('ADMINISTRADOR', 'RECEPCIONISTA', 'PROFESIONAL');
const gestion = permitir('ADMINISTRADOR', 'RECEPCIONISTA');

router.get('/', lectura, listarPacientes);
router.get('/:id', lectura, obtenerPaciente);
router.post('/', gestion, crearPaciente);
router.put('/:id', gestion, actualizarPaciente);
router.patch('/:id/estado', gestion, cambiarEstadoPaciente);

export default router;
