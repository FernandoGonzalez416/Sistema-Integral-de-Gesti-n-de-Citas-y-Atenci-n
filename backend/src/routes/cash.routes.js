import { Router } from 'express';
import {
  obtenerCajaActual,
  listarCajas,
  obtenerCaja,
  abrirCaja,
  cerrarCaja,
  movimientosCaja
} from '../controllers/cash.controller.js';
import { auth } from '../middlewares/auth.js';
import { permitir } from '../middlewares/roles.js';

const router = Router();

router.use(auth, permitir('ADMINISTRADOR', 'RECEPCIONISTA'));

router.get('/', listarCajas);
router.get('/actual', obtenerCajaActual);
router.post('/abrir', abrirCaja);
// Antes de /:id para que "movimientos" no se interprete como id.
router.get('/:id/movimientos', movimientosCaja);
router.get('/:id', obtenerCaja);
router.post('/:id/cerrar', cerrarCaja);

export default router;
