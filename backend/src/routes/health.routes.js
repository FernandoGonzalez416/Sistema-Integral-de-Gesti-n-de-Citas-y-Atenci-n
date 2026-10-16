import { Router } from 'express';

const router = Router();

// GET /api/health — verifica que la API está viva.
// No requiere autenticación.
router.get('/', (req, res) => {
  res.json({
    ok: true,
    service: 'sigca-backend',
    timestamp: new Date().toISOString()
  });
});

export default router;
