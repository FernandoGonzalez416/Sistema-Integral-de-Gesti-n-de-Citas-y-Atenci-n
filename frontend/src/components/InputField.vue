<template>
  <div
    class="if"
    :class="{ 'if-error': !!error, 'if-disabled': disabled, 'if-fijo': fijo, 'if-icono': !!icono }"
  >
    <div class="if-caja" v-brillo>
      <Icono v-if="icono" :name="icono" :size="19" class="if-ico" />
      <input
        :id="idCampo"
        ref="entrada"
        class="if-input"
        :type="tipoReal"
        :value="modelValue"
        placeholder=" "
        :autocomplete="autocomplete"
        :inputmode="inputmode"
        :maxlength="maxlength"
        :min="min"
        :max="max"
        :step="step"
        :disabled="disabled"
        :readonly="readonly"
        :aria-invalid="!!error"
        :aria-describedby="error || hint ? `${idCampo}-msg` : undefined"
        @input="$emit('update:modelValue', $event.target.value)"
        @blur="$emit('blur')"
      />
      <label :for="idCampo" class="if-label">{{ label }}</label>
      <span v-if="sufijo" class="if-sufijo">{{ sufijo }}</span>
      <button
        v-if="type === 'password'"
        type="button"
        class="if-ojo"
        :aria-label="ver ? 'Ocultar contraseña' : 'Mostrar contraseña'"
        :aria-pressed="ver"
        tabindex="0"
        @click="ver = !ver"
      >
        <Icono :name="ver ? 'eye-off' : 'eye'" :size="19" />
      </button>
      <span v-if="disabled && icono !== 'lock'" class="if-candado"><Icono name="lock" :size="15" /></span>
    </div>
    <Transition name="if-msg">
      <p v-if="error" :id="`${idCampo}-msg`" class="if-mensaje if-mensaje-error" role="alert">
        <Icono name="alert" :size="14" /> {{ error }}
      </p>
      <p v-else-if="hint" :id="`${idCampo}-msg`" class="if-mensaje">{{ hint }}</p>
    </Transition>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import Icono from './Icono.vue';
import { vBrillo } from '../composables/efectos.js';

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, required: true },
  type: { type: String, default: 'text' },
  icono: { type: String, default: '' },
  error: { type: String, default: '' },
  hint: { type: String, default: '' },
  sufijo: { type: String, default: '' },
  autocomplete: { type: String, default: 'off' },
  inputmode: { type: String, default: undefined },
  maxlength: { type: [String, Number], default: undefined },
  min: { type: [String, Number], default: undefined },
  max: { type: [String, Number], default: undefined },
  step: { type: [String, Number], default: undefined },
  disabled: { type: Boolean, default: false },
  readonly: { type: Boolean, default: false }
});
defineEmits(['update:modelValue', 'blur']);

const ver = ref(false);
const entrada = ref(null);
const idCampo = `if-${Math.random().toString(36).slice(2, 9)}`;
const tipoReal = computed(() => (props.type === 'password' && ver.value ? 'text' : props.type));
// Los campos de fecha muestran siempre su formato: la etiqueta no puede quedar encima.
const fijo = computed(() => props.type === 'date');

defineExpose({ focus: () => entrada.value?.focus() });
</script>

<style>
.if { margin-bottom: 1rem; }
.if-caja {
  --mx: 50%;
  --my: 50%;
  position: relative;
  display: flex;
  align-items: center;
  border: 1.5px solid #cfdde6;
  border-radius: 14px;
  background: #fff;
  transition: border-color 0.25s, box-shadow 0.25s, background 0.25s, transform 0.25s;
}
/* Resplandor que sigue al cursor */
.if-caja::before {
  content: '';
  position: absolute;
  inset: -1.5px;
  border-radius: inherit;
  background: radial-gradient(160px circle at var(--mx) var(--my), rgba(42, 157, 154, 0.35), transparent 70%);
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
  -webkit-mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0);
  mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0);
  padding: 1.5px;
}
.if-caja:hover::before { opacity: 1; }
.if-caja:hover { border-color: #9fc3d6; }
.if-caja:focus-within {
  border-color: #2a9d9a;
  box-shadow: 0 0 0 4px rgba(42, 157, 154, 0.16), 0 8px 20px -10px rgba(15, 61, 94, 0.35);
}
.if-ico { margin-left: 0.95rem; color: #7a97a8; transition: color 0.25s, transform 0.3s; }
.if-caja:focus-within .if-ico { color: #1a5c8a; transform: scale(1.1); }

.if-input {
  flex: 1;
  min-width: 0;
  box-sizing: border-box;
  height: 54px;
  padding: 1.35rem 0.95rem 0.45rem;
  border: 0;
  outline: 0;
  background: transparent;
  font: inherit;
  font-size: 1rem;
  color: #12354d;
}
.if-icono .if-input { padding-left: 0.7rem; }
.if-input::placeholder { color: transparent; }

.if-label {
  position: absolute;
  left: 0.95rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6b8798;
  font-size: 0.98rem;
  pointer-events: none;
  transform-origin: left top;
  transition: transform 0.2s ease, color 0.2s, top 0.2s;
  max-width: calc(100% - 2.5rem);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.if-icono .if-label { left: 2.9rem; }
.if-input:focus ~ .if-label,
.if-input:not(:placeholder-shown) ~ .if-label,
.if-fijo .if-label {
  top: 0.5rem;
  transform: translateY(0) scale(0.76);
  color: #1a5c8a;
  font-weight: 600;
}

.if-sufijo { padding-right: 0.95rem; color: #6b8798; font-size: 0.9rem; font-weight: 600; }
.if-ojo {
  appearance: none;
  border: 0;
  background: transparent;
  color: #6b8798;
  width: 44px;
  height: 44px;
  margin-right: 0.15rem;
  display: grid;
  place-items: center;
  border-radius: 10px;
  cursor: pointer;
  transition: color 0.2s, background 0.2s;
}
.if-ojo:hover { color: #1a5c8a; background: rgba(26, 92, 138, 0.08); }
.if-ojo:focus-visible { outline: 3px solid #5eeaea; outline-offset: -2px; }
.if-candado { padding-right: 0.95rem; color: #9db3c1; display: flex; }

.if-error .if-caja { border-color: #d64545; animation: if-sacudir 0.38s; }
.if-error .if-caja:focus-within { box-shadow: 0 0 0 4px rgba(214, 69, 69, 0.15); }
.if-error .if-label { color: #c23b3b; }
.if-disabled .if-caja { background: #f1f6f9; border-style: dashed; }
.if-disabled .if-input { color: #587487; cursor: not-allowed; }

.if-mensaje { margin: 0.35rem 0.35rem 0; font-size: 0.82rem; color: #5b7686; line-height: 1.35; }
.if-mensaje-error { color: #c23b3b; display: flex; align-items: center; gap: 0.3rem; }

.if-msg-enter-active, .if-msg-leave-active { transition: opacity 0.2s, transform 0.2s; }
.if-msg-enter-from, .if-msg-leave-to { opacity: 0; transform: translateY(-4px); }

@keyframes if-sacudir {
  20% { transform: translateX(-5px); }
  40% { transform: translateX(5px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(3px); }
}

@media (prefers-reduced-motion: reduce) {
  .if-caja, .if-label, .if-ico { transition: none; }
  .if-error .if-caja { animation: none; }
}
</style>
