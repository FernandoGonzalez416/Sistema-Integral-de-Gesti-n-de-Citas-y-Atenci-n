import { Router } from 'express';
import {
  listarRelaciones,
  asociarResponsable,
  desasociarResponsable
} from '../controllers/patientRelations.controller.js';
import { auth } from '../middlewares/auth.js';
import { permitir } from '../middlewares/roles.js';

const router = Router({ mergeParams: true });

router.use(auth, permitir('ADMINISTRADOR', 'RECEPCIONISTA'));

router.get('/', listarRelaciones);
router.post('/', asociarResponsable);
router.patch('/:relacionId/desasociar', desasociarResponsable);

export default router;