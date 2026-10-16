import { Router } from 'express';
import {
  listarMaterialesPaciente,
  asignarMaterial,
  desasignarMaterial
} from '../controllers/patientMaterials.controller.js';
import { auth } from '../middlewares/auth.js';
import { permitir } from '../middlewares/roles.js';

const router = Router({ mergeParams: true });

router.use(auth, permitir('ADMINISTRADOR', 'RECEPCIONISTA', 'PROFESIONAL'));

router.get('/', listarMaterialesPaciente);
router.post('/', asignarMaterial);
router.patch('/:relacionId/desasignar', desasignarMaterial);

export default router;
