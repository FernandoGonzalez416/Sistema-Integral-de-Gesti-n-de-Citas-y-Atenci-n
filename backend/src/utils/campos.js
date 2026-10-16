// Utilidades para evitar la ASIGNACIÓN MASIVA (mass assignment).
// Solo se copian los campos permitidos; se ignoran claves no previstas
// (_id, createdAt, updatedAt, __v y cualquier campo fuera de la lista blanca).

// Devuelve un objeto nuevo con solo los campos permitidos presentes en `body`.
export function soloCampos(body, campos) {
  const datos = body || {};
  const salida = {};
  for (const campo of campos) {
    if (datos[campo] !== undefined) salida[campo] = datos[campo];
  }
  return salida;
}

// Copia en `doc` solo los campos permitidos presentes en `body`.
export function aplicarCamposPermitidos(doc, body, campos) {
  const datos = body || {};
  for (const campo of campos) {
    if (datos[campo] !== undefined) doc[campo] = datos[campo];
  }
  return doc;
}
