import { Router } from 'express';
import {
  obtenerCajaActual,
  listarCajas,
  obtenerCaja,
  abrirCaja,
  cerrarCaja
} from '../controllers/cash.controller.js';
import { auth } from '../middlewares/auth.js';
import { permitir } from '../middlewares/roles.js';

const router = Router();

router.use(auth, permitir('ADMINISTRADOR', 'RECEPCIONISTA'));

router.get('/', listarCajas);
router.get('/actual', obtenerCajaActual);
router.get('/:id', obtenerCaja);
router.post('/abrir', abrirCaja);
router.post('/:id/cerrar', cerrarCaja);

export default router;
