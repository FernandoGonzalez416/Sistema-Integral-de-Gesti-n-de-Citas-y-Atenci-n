// Manejo centralizado de errores. Debe registrarse al final en app.js.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  console.error(err);
  // Los errores de validación/casteo de Mongoose provienen de datos de entrada
  // inválidos (tipos no válidos, referencias mal formadas) → 400, nunca 500.
  const esErrorDeEntrada = err.name === 'ValidationError' || err.name === 'CastError';
  const status = err.status || (esErrorDeEntrada ? 400 : 500);
  // No exponer detalles internos en errores 5xx; el detalle queda en el log del servidor.
  const message = status >= 500 ? 'Error interno del servidor' : err.message || 'Error interno del servidor';
  res.status(status).json({
    ok: false,
    message
  });
}
