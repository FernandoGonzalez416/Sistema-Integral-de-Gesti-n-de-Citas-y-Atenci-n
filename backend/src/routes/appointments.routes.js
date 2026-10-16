import { Router } from 'express';
import {
  listarCitas,
  obtenerCita,
  crearCita,
  atenderSolicitud,
  cambiarEstadoCita,
  reprogramarCita
} from '../controllers/appointments.controller.js';
import { auth } from '../middlewares/auth.js';
import { permitir } from '../middlewares/roles.js';

const router = Router();

router.use(auth, permitir('ADMINISTRADOR', 'RECEPCIONISTA'));

router.get('/', listarCitas);
router.get('/:id', obtenerCita);
router.post('/', crearCita);
router.post('/solicitudes/:solicitudId/atender', atenderSolicitud);
router.patch('/:id/estado', cambiarEstadoCita);
router.patch('/:id/reprogramar', reprogramarCita);

export default router;