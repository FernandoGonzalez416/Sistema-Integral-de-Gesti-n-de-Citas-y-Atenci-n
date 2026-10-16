// 404 para rutas no encontradas bajo /api u otras.
export function notFound(req, res, next) {
  res.status(404).json({
    ok: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
  });
}
