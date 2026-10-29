# Base de datos incluida

Esta carpeta permite levantar SIGCA con los mismos datos de la entrega sin
depender de la MongoDB de otra persona.

- `sigca/`: un archivo JSON por colección (formato Extended JSON: `{ "$oid": … }`
  y `{ "$date": … }`) más `_meta.json` con la fecha y los conteos del export.

## Restaurar

```
cd backend
npm run db:importar      # solo si la base destino está vacía
npm run db:restaurar     # reemplaza esas colecciones si ya tienen datos
```

La URI sale de `backend/.env` (`MONGO_URI`); por defecto
`mongodb://localhost:27017/sigca`. También puedes apuntar a otra base:

```
MONGO_URI=mongodb://localhost:27017/sigca_demo npm run db:importar
```

## Volver a exportar

```
cd backend
npm run db:exportar
```

No se usan `mongodump`/`mongorestore`: el importador usa el driver de MongoDB que
ya instala el proyecto y reconstruye `ObjectId` y `Date`.

## Qué incluye

18 colecciones y 126 documentos: usuarios, profesionales, pacientes,
responsables y sus relaciones, servicios, citas, solicitudes, materiales y
asignaciones, pagos, comprobantes, cajas, contenido institucional, carrusel,
publicaciones, horarios y el contador de comprobantes.
