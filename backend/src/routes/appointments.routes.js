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

router.use(auth);

const personal = permitir('ADMINISTRADOR', 'RECEPCIONISTA');
const lectura = permitir('ADMINISTRADOR', 'RECEPCIONISTA', 'PROFESIONAL');

router.get('/', lectura, listarCitas);
router.get('/:id/pagos', personal, listarPagosCita);
router.get('/:id/saldo', personal, obtenerSaldoCita);
router.get('/:id', lectura, obtenerCita);
router.post('/', personal, crearCita);
router.put('/:id', personal, actualizarCita);
// PROFESIONAL: el controlador limita la transición a COMPLETADA sobre citas propias.
router.patch('/:id/estado', lectura, cambiarEstadoCita);
// Conversión de una solicitud en cita (B4: atómica con compensación).
router.post('/solicitudes/:solicitudId/atender', personal, atenderSolicitud);

export default router;
