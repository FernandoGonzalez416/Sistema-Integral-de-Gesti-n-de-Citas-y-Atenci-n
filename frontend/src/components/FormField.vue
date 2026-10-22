<template>
  <label class="campo" :class="{ 'campo-checkbox': type === 'checkbox' }">
    <span>{{ etiqueta }}</span>
    <input
      :type="type"
      :value="type === 'checkbox' ? undefined : modelValue"
      :checked="type === 'checkbox' ? Boolean(modelValue) : undefined"
      :placeholder="type === 'checkbox' ? undefined : placeholder"
      @input="actualizar"
    />
  </label>
</template>

<script setup>
const props = defineProps({
  etiqueta: { type: String, required: true },
  // Los checkboxes usan Boolean; el resto de campos, String.
  modelValue: { type: [String, Boolean], default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' }
});
const emit = defineEmits(['update:modelValue']);

function actualizar(evento) {
  const valor = props.type === 'checkbox' ? evento.target.checked : evento.target.value;
  emit('update:modelValue', valor);
}
</script>

<style>
.campo { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0.75rem; }
.campo input { padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; }
.campo-checkbox { flex-direction: row; align-items: center; gap: 0.5rem; }
.campo-checkbox input { width: 1rem; height: 1rem; padding: 0; }
</style>
