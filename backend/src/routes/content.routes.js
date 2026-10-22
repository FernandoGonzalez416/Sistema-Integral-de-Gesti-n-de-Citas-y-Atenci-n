import { Router } from 'express';
import {
  listarPublico,
  obtenerPorClave,
  listarTodos,
  crear,
  actualizar
} from '../controllers/content.controller.js';
import { obtenerSitio, actualizarSitio } from '../controllers/site.controller.js';
import carouselRoutes from './carousel.routes.js';
import { auth } from '../middlewares/auth.js';
import { permitir } from '../middlewares/roles.js';

const router = Router();

router.get('/', listarPublico);
router.get('/admin/todos', auth, permitir('ADMINISTRADOR'), listarTodos);
// Rutas fijas ANTES de /:clave para que no se interpreten como una clave.
router.get('/sitio', obtenerSitio);
router.put('/sitio', auth, permitir('ADMINISTRADOR'), actualizarSitio);
router.use('/carrusel', carouselRoutes);
router.get('/:clave', obtenerPorClave);
router.post('/', auth, permitir('ADMINISTRADOR'), crear);
router.put('/:id', auth, permitir('ADMINISTRADOR'), actualizar);

export default router;
