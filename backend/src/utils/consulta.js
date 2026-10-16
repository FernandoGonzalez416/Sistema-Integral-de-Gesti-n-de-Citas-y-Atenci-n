// Utilidades para sanear parámetros de consulta (búsqueda y paginación).
// Evitan que entradas del usuario produzcan errores 500: una expresión regular
// inválida (p. ej. "(") o un `skip` negativo hacen fallar la consulta.

// Convierte un texto de búsqueda en una expresión regular SEGURA: el texto se
// escapa y se trata como literal, nunca como patrón. Devuelve null si está vacío.
export function regexBusqueda(valor) {
  const texto = String(valor ?? '').trim();
  if (!texto) return null;
  const escapado = texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(escapado, 'i');
}

// Normaliza page/limit a enteros >= 1 (page 1, limit 20 por defecto) y calcula
// el `skip`. Un `limit=0`/no numérico o un `page` <= 0 no llegan a la consulta.
export function paginacion(query = {}) {
  let page = Number.parseInt(query.page, 10);
  if (!Number.isInteger(page) || page < 1) page = 1;
  let limit = Number.parseInt(query.limit, 10);
  if (!Number.isInteger(limit) || limit < 1) limit = 20;
  return { page, limit, skip: (page - 1) * limit };
}
