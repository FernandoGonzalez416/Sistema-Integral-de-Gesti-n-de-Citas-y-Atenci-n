import { Router } from 'express';
import {
  listarPagos,
  obtenerPago,
  obtenerComprobantePago,
  obtenerSaldoCita,
  registrarPago,
  anularPago
} from '../controllers/payments.controller.js';
import { auth } from '../middlewares/auth.js';
import { permitir } from '../middlewares/roles.js';

const router = Router();

router.use(auth, permitir('ADMINISTRADOR', 'RECEPCIONISTA'));

router.get('/', listarPagos);
router.get('/citas/:citaId/saldo', obtenerSaldoCita);
router.get('/:id/comprobante', obtenerComprobantePago);
router.get('/:id', obtenerPago);
router.post('/', registrarPago);
router.patch('/:id/anular', anularPago);

export default router;
