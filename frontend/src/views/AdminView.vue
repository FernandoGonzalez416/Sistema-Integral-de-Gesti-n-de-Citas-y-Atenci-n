<template>
  <h1>Panel administrativo</h1>
  <p>Módulos en construcción (desde Fase 3: usuarios, citas, pagos, caja).</p>

  <Card titulo="Ejemplo de componentes">
    <FormField etiqueta="Texto de prueba" v-model="texto" placeholder="Escribe algo…" />
    <p>Escribiste: {{ texto }}</p>
  </Card>
</template>

<script setup>
import { ref } from 'vue';
import Card from '../components/Card.vue';
import FormField from '../components/FormField.vue';

const texto = ref('');
</script>
