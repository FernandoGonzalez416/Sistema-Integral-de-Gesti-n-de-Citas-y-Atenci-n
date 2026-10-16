import { Router } from 'express';
import {
  listarMateriales,
  obtenerMaterial,
  crearMaterial,
  actualizarMaterial,
  desactivarMaterial
} from '../controllers/materials.controller.js';
import { auth } from '../middlewares/auth.js';
import { permitir } from '../middlewares/roles.js';

const router = Router();

// Consulta del catálogo: ADMINISTRADOR, RECEPCIONISTA y PROFESIONAL (por diseño).
const lectura = permitir('ADMINISTRADOR', 'RECEPCIONISTA', 'PROFESIONAL');
// Gestión del catálogo (crear/editar/desactivar): solo ADMINISTRADOR y RECEPCIONISTA.
const gestion = permitir('ADMINISTRADOR', 'RECEPCIONISTA');

router.get('/', auth, lectura, listarMateriales);
router.get('/:id', auth, lectura, obtenerMaterial);
router.post('/', auth, gestion, crearMaterial);
router.patch('/:id', auth, gestion, actualizarMaterial);
router.patch('/:id/desactivar', auth, gestion, desactivarMaterial);

export default router;