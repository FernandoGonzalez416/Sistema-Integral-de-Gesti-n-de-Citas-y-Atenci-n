import { Router } from 'express';
import {
  listarResponsables,
  obtenerResponsable,
  crearResponsable,
  actualizarResponsable,
  desactivarResponsable
} from '../controllers/responsibles.controller.js';
import { auth } from '../middlewares/auth.js';
import { permitir } from '../middlewares/roles.js';

const router = Router();

router.use(auth, permitir('ADMINISTRADOR', 'RECEPCIONISTA'));

router.get('/', listarResponsables);
router.get('/:id', obtenerResponsable);
router.post('/', crearResponsable);
router.patch('/:id', actualizarResponsable);
router.patch('/:id/desactivar', desactivarResponsable);

export default router;