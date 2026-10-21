import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router/index.js';
import { useAuthStore } from './stores/auth.js';

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount('#app');

// Al abrir la app: se muestra al instante lo guardado en el navegador y en segundo plano
// se refresca el perfil desde MongoDB (y se reenvían cambios hechos sin conexión).
const auth = useAuthStore();
auth.iniciar().then(() => {
  // Si el token había vencido, se cierra la sesión: no se puede seguir en una ruta privada.
  if (!auth.token && router.currentRoute.value.meta.requiereAuth) router.replace({ name: 'login' });
});