import { createRouter, createWebHistory } from 'vue-router';
import PublicLayout from '../layouts/PublicLayout.vue';
import AdminLayout from '../layouts/AdminLayout.vue';
import HomeView from '../views/HomeView.vue';
import ServiciosView from '../views/ServiciosView.vue';
import { abrirContacto } from '../composables/contactoModal.js';
import ContenidoView from '../views/ContenidoView.vue';
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
import RegistroView from '../views/RegistroView.vue';
import PerfilView from '../views/PerfilView.vue';
import { useAuthStore } from '../stores/auth.js';
import UsersView from '../views/UsersView.vue';
import ServicesView from '../views/ServicesView.vue';
import ContentView from '../views/ContentView.vue';
import NotFoundView from '../views/NotFoundView.vue';

const router = createRouter({
  history: createWebHistory(),
  // Al cambiar de pantalla se vuelve arriba; con #ancla se baja a esa sección.
  scrollBehavior(to, from, guardada) {
    if (guardada) return guardada;
    if (to.hash) {
      return { el: to.hash, top: 16, behavior: 'smooth' };
    }
    return { top: 0 };
  },
  routes: [
    {
      path: '/',
      component: PublicLayout,
      children: [
        { path: '', name: 'inicio', component: HomeView },
        // "Servicios" ahora incluye el formulario de solicitar cita.
        { path: 'servicios', name: 'servicios-pub', component: ServiciosView },
        // "Contacto" ya no es una pantalla: abre la ventana de contacto.
        // Si se entra directo por URL, se muestra Inicio con la ventana encima.
        {
          path: 'contacto',
          name: 'contacto-pub',
          component: HomeView,
          beforeEnter: (to, from) => {
            abrirContacto('info');
            return from.name ? false : { path: '/', replace: true };
          }
        },
        // Contenido educativo y corporativo completo (se abre desde "Ver más" en Inicio).
        { path: 'contenido', name: 'contenido', component: ContenidoView },
        // Sesión y perfil. "soloInvitados": si ya hay sesión se redirige a la pantalla del rol.
        { path: 'login', name: 'login', component: LoginView, meta: { soloInvitados: true } },
        { path: 'registro', name: 'registro', component: RegistroView, meta: { soloInvitados: true } },
        // Perfil: lo usan tanto clientes como personal (administrador, recepción, profesional).
        { path: 'perfil', name: 'perfil', component: PerfilView, meta: { requiereAuth: true } },

        // Rutas antiguas: se conservan como redirecciones para no romper enlaces.
        { path: 'horarios', redirect: { path: '/', hash: '#horarios' } },
        { path: 'educativo', redirect: '/contenido' },
        { path: 'solicitar-cita', redirect: { path: '/servicios', hash: '#solicitar-cita' } }
      ]
    },
    {
      path: '/admin',
      component: AdminLayout,
      // Panel interno: solo personal. Un CLIENTE que lo intente vuelve a su perfil.
      meta: { requiereAuth: true, requierePersonal: true },
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

// Ocultar rutas privadas no basta: el backend vuelve a verificar token y rol en cada petición.
router.beforeEach(async (to) => {
  const auth = useAuthStore();

  if (!auth.token) {
    if (to.meta.requiereAuth) return { name: 'login', query: { redirect: to.fullPath } };
    return;
  }

  // Hay token pero no datos del usuario (p. ej. sesión iniciada antes de existir la caché): se cargan una vez.
  if (!auth.usuario) {
    try { await auth.cargar(); } catch { /* sin conexión o error: se decide abajo */ }
  }
  if (!auth.token || !auth.usuario) {
    return to.meta.requiereAuth ? { name: 'login', query: { redirect: to.fullPath } } : undefined;
  }

  if (to.meta.soloInvitados) return auth.rutaInicio;
  if (to.meta.requierePersonal && !auth.esPersonal) return { name: 'perfil' };
});

export default router;