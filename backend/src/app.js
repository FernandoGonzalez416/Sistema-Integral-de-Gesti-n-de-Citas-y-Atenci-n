import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import servicesRoutes from './routes/services.routes.js';
import contentRoutes from './routes/content.routes.js';
import schedulesRoutes from './routes/schedules.routes.js';
import publicationsRoutes from './routes/publications.routes.js';
import contactRoutes from './routes/contact.routes.js';
import requestsRoutes from './routes/requests.routes.js';
import patientsRoutes from './routes/patients.routes.js';
import responsiblesRoutes from './routes/responsibles.routes.js';
import patientRelationsRoutes from './routes/patientRelations.routes.js';
import professionalsRoutes from './routes/professionals.routes.js';
import appointmentsRoutes from './routes/appointments.routes.js';
import materialsRoutes from './routes/materials.routes.js';
import patientMaterialsRoutes from './routes/patientMaterials.routes.js';
import paymentsRoutes from './routes/payments.routes.js';
import cashRoutes from './routes/cash.routes.js';
import { notFound } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

app.use(cors({ origin: env.frontendUrl }));
// 1 MB: el perfil incluye la foto (data URL ya comprimida por el frontend, ~20-60 KB).
app.use(express.json({ limit: '1mb' }));

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usersRoutes);
app.use('/api/servicios', servicesRoutes);
app.use('/api/contenido', contentRoutes);
app.use('/api/horarios', schedulesRoutes);
app.use('/api/publicaciones', publicationsRoutes);
app.use('/api/contacto', contactRoutes);
app.use('/api/solicitudes-cita', requestsRoutes);
// Las subrutas de /api/pacientes deben montarse ANTES de /api/pacientes: si no,
// el guard de /api/pacientes (ADMIN/RECEP) intercepta las subrutas y bloquea a
// PROFESIONAL en /api/pacientes/:id/materiales (que su propio router sí permite).
app.use('/api/pacientes/:pacienteId/responsables', patientRelationsRoutes);
app.use('/api/pacientes/:pacienteId/materiales', patientMaterialsRoutes);
app.use('/api/pacientes', patientsRoutes);
app.use('/api/responsables', responsiblesRoutes);
app.use('/api/profesionales', professionalsRoutes);
app.use('/api/citas', appointmentsRoutes);
app.use('/api/materiales', materialsRoutes);
app.use('/api/pagos', paymentsRoutes);
app.use('/api/cajas', cashRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;