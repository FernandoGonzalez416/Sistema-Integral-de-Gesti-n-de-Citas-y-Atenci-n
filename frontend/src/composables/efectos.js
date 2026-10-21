import { ref, watch, onUnmounted } from 'vue';

const reducido = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// v-brillo: un resplandor suave sigue al cursor dentro del elemento (usa --mx / --my en CSS).
export const vBrillo = {
  mounted(el) {
    const mover = (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    };
    el.addEventListener('pointermove', mover);
    el._brilloOff = () => el.removeEventListener('pointermove', mover);
  },
  unmounted(el) { el._brilloOff?.(); }
};

// v-inclinar: inclinación 3D sutil según la posición del cursor.
export const vInclinar = {
  mounted(el, { value = 6 }) {
    if (reducido()) return;
    const mover = (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateX(${(-y * value).toFixed(2)}deg) rotateY(${(x * value).toFixed(2)}deg)`;
    };
    const salir = () => { el.style.transform = ''; };
    el.addEventListener('pointermove', mover);
    el.addEventListener('pointerleave', salir);
    el._inclinarOff = () => {
      el.removeEventListener('pointermove', mover);
      el.removeEventListener('pointerleave', salir);
    };
  },
  unmounted(el) { el._inclinarOff?.(); }
};

// Número que "cuenta" suavemente hasta su nuevo valor. Devuelve una ref animada.
export function useContador(fuente, { duracion = 700, decimales = 0 } = {}) {
  const valor = ref(0);
  let raf = 0;
  watch(
    fuente,
    (destino) => {
      cancelAnimationFrame(raf);
      const fin = Number(destino);
      if (!Number.isFinite(fin)) { valor.value = 0; return; }
      if (reducido()) { valor.value = fin; return; }
      const inicio = valor.value;
      const t0 = performance.now();
      const paso = (t) => {
        const p = Math.min(1, (t - t0) / duracion);
        const suave = 1 - Math.pow(1 - p, 3);
        valor.value = Number((inicio + (fin - inicio) * suave).toFixed(decimales));
        if (p < 1) raf = requestAnimationFrame(paso);
      };
      raf = requestAnimationFrame(paso);
    },
    { immediate: true }
  );
  onUnmounted(() => cancelAnimationFrame(raf));
  return valor;
}
