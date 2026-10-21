import { Router } from 'express';
import {
  listarCitas,
  obtenerCita,
  listarPagosCita,
  obtenerSaldoCita,
  crearCita,
  actualizarCita,
  atenderSolicitud,
  cambiarEstadoCita
} from '../controllers/appointments.controller.js';
import { auth } from '../middlewares/auth.js';
import { permitir } from '../middlewares/roles.js';

const router = Router();

router.use(auth, permitir('ADMINISTRADOR', 'RECEPCIONISTA'));

router.get('/', listarCitas);
router.get('/:id/pagos', listarPagosCita);
router.get('/:id/saldo', obtenerSaldoCita);
router.get('/:id', obtenerCita);
router.post('/', crearCita);
router.put('/:id', actualizarCita);
router.patch('/:id/estado', cambiarEstadoCita);
// Conversión de una solicitud en cita (B4 la hará atómica).
router.post('/solicitudes/:solicitudId/atender', atenderSolicitud);

export default router;
