import 'dotenv/config';

// En producción, JWT_SECRET es OBLIGATORIO: el valor por defecto es público
// (conocido) y permitiría falsificar tokens. Se aborta el arranque si falta.
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET es obligatorio cuando NODE_ENV=production (no se permite el valor por defecto)');
}

// Variables de entorno con valores por defecto para desarrollo local.
// Los secretos reales van en backend/.env (no versionado).
export const env = {
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/sigca',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'sigca-secreto-solo-desarrollo',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@sigca.local',
  adminPassword: process.env.ADMIN_PASSWORD || 'Admin123'
};
