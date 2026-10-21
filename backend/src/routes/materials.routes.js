import { Router } from 'express';
import {
  listarMateriales,
  obtenerMaterial,
  crearMaterial,
  actualizarMaterial
} from '../controllers/materials.controller.js';
import { auth } from '../middlewares/auth.js';
import { permitir } from '../middlewares/roles.js';

const router = Router();

// Consulta del catálogo: ADMINISTRADOR, RECEPCIONISTA y PROFESIONAL.
const lectura = permitir('ADMINISTRADOR', 'RECEPCIONISTA', 'PROFESIONAL');
// Gestión del catálogo (crear/editar/desactivar vía PUT activo=false): ADMIN y RECEP.
const gestion = permitir('ADMINISTRADOR', 'RECEPCIONISTA');

router.get('/', auth, lectura, listarMateriales);
router.get('/:id', auth, lectura, obtenerMaterial);
router.post('/', auth, gestion, crearMaterial);
router.put('/:id', auth, gestion, actualizarMaterial);

export default router;
