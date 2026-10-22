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

router.use(auth);

// El PROFESIONAL necesita el directorio para mostrar el nombre de sus citas.
// La gestión (alta/edición/baja) sigue restringida a ADMIN/RECEP.
const lectura = permitir('ADMINISTRADOR', 'RECEPCIONISTA', 'PROFESIONAL');
const gestion = permitir('ADMINISTRADOR', 'RECEPCIONISTA');

router.get('/', lectura, listarProfesionales);
router.get('/:id', lectura, obtenerProfesional);
router.post('/', gestion, crearProfesional);
router.patch('/:id', gestion, actualizarProfesional);
router.patch('/:id/desactivar', gestion, desactivarProfesional);

export default router;
