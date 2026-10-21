<template>
  <span class="avatar" :style="{ '--sz': `${size}px`, '--tono': tono }" :class="{ 'con-foto': !!src }">
    <img v-if="src && !fallo" :src="src" :alt="alt" draggable="false" @error="fallo = true" />
    <span v-else class="avatar-iniciales" aria-hidden="true">
      <Icono v-if="!iniciales" name="user" :size="size * 0.5" />
      <template v-else>{{ iniciales }}</template>
    </span>
  </span>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import Icono from './Icono.vue';

// Foto de perfil o, si no hay, iniciales sobre un color estable derivado del nombre.
const props = defineProps({
  src: { type: String, default: '' },
  nombre: { type: String, default: '' },
  size: { type: Number, default: 40 },
  alt: { type: String, default: '' }
});

const fallo = ref(false);
watch(() => props.src, () => { fallo.value = false; });

const iniciales = computed(() => {
  const partes = props.nombre.trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return '';
  return (partes[0][0] + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase();
});

const TONOS = [
  'linear-gradient(135deg,#1a5c8a,#2a9d9a)',
  'linear-gradient(135deg,#0f3d5e,#35c4bf)',
  'linear-gradient(135deg,#2a9d9a,#4aa3df)',
  'linear-gradient(135deg,#1f7a8f,#6fd6c7)',
  'linear-gradient(135deg,#355c9a,#35c4bf)'
];
const tono = computed(() => {
  let h = 0;
  for (const c of props.nombre) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TONOS[h % TONOS.length];
});
</script>

<style>
.avatar {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: var(--sz);
  height: var(--sz);
  border-radius: 50%;
  overflow: hidden;
  background: var(--tono);
  color: #fff;
  user-select: none;
}
.avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
.avatar-iniciales {
  font-size: calc(var(--sz) * 0.38);
  font-weight: 700;
  letter-spacing: 0.02em;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
