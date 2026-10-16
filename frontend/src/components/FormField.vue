<template>
  <label class="campo">
    <span>{{ etiqueta }}</span>
    <input
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      @input="$emit('update:modelValue', $event.target.value)"
    />
  </label>
</template>

<script setup>
defineProps({
  etiqueta: { type: String, required: true },
  modelValue: { type: String, default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' }
});
defineEmits(['update:modelValue']);
</script>

<style>
.campo { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0.75rem; }
.campo input { padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; }
</style>
