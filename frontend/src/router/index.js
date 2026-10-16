import { createRouter, createWebHistory } from 'vue-router';
import PublicLayout from '../layouts/PublicLayout.vue';
import AdminLayout from '../layouts/AdminLayout.vue';
import HomeView from '../views/HomeView.vue';
import ServiciosView from '../views/ServiciosView.vue';
import HorariosView from '../views/HorariosView.vue';
import ContactoView from '../views/ContactoView.vue';
import SolicitarCitaView from '../views/SolicitarCitaView.vue';
import EducativoView from '../views/EducativoView.vue';
import PacientesView from '../views/PacientesView.vue';
import ResponsablesView from '../views/ResponsablesView.vue';
import PacienteResponsablesView from '../views/PacienteResponsablesView.vue';
import MaterialesView from '../views/MaterialesView.vue';
import PacienteMaterialesView from '../views/PacienteMaterialesView.vue';
import PagosView from '../views/PagosView.vue';
import CajaView from '../views/CajaView.vue';
import CalendarioView from '../views/CalendarioView.vue';
import AdminView from '../views/AdminView.vue';
import LoginView from '../views/LoginView.vue';
import UsersView from '../views/UsersView.vue';
import ServicesView from '../views/ServicesView.vue';
import ContentView from '../views/ContentView.vue';
import NotFoundView from '../views/NotFoundView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: PublicLayout,
      children: [
        { path: '', name: 'inicio', component: HomeView },
        { path: 'servicios', name: 'servicios-pub', component: ServiciosView },
        { path: 'horarios', name: 'horarios-pub', component: HorariosView },
        { path: 'contacto', name: 'contacto-pub', component: ContactoView },
        { path: 'solicitar-cita', name: 'solicitar-cita', component: SolicitarCitaView },
        { path: 'educativo', name: 'educativo', component: EducativoView },
        { path: 'login', name: 'login', component: LoginView }
      ]
    },
    {
      path: '/admin',
      component: AdminLayout,
      meta: { requiereAuth: true },
      children: [
        { path: '', name: 'admin', component: AdminView },
        { path: 'usuarios', name: 'usuarios', component: UsersView },
        { path: 'servicios', name: 'servicios', component: ServicesView },
        { path: 'contenidos', name: 'contenidos', component: ContentView },
        { path: 'pacientes', name: 'pacientes', component: PacientesView },
        { path: 'pacientes/:pacienteId/responsables', name: 'paciente-responsables', component: PacienteResponsablesView },
        { path: 'pacientes/:pacienteId/materiales', name: 'paciente-materiales', component: PacienteMaterialesView },
        { path: 'responsables', name: 'responsables', component: ResponsablesView },
        { path: 'materiales', name: 'materiales', component: MaterialesView },
        { path: 'pagos', name: 'pagos', component: PagosView },
        { path: 'caja', name: 'caja', component: CajaView },
        { path: 'calendario', name: 'calendario', component: CalendarioView }
      ]
    },
    { path: '/:ruta(.*)', name: 'no-encontrada', component: NotFoundView }
  ]
});

// Ocultar rutas privadas no basta: el backend vuelve a verificar token y rol.
router.beforeEach((to) => {
  const token = localStorage.getItem('sigca_token');
  if (to.meta.requiereAuth && !token) return { name: 'login' };
  if (to.name === 'login' && token) return { name: 'admin' };
});

export default router;
