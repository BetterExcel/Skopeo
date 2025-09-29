<template>
  <div class="overlay">
    <div class="dialog">
      <h3>Preview changes</h3>
      <p>Estimated affected cells: <strong>{{ summary.totalCells }}</strong></p>
      <ul>
        <li v-for="r in summary.ranges" :key="r">{{ r }}</li>
      </ul>
      <div class="actions">
        <button @click="$emit('cancel')">Cancel</button>
        <button class="primary" @click="$emit('confirm')">Execute</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ summary: { totalCells: number; ranges: string[] } }>();
</script>

<style scoped>
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; z-index: 10000; }
.dialog { background: #fff; width: 420px; max-width: 90vw; border-radius: 8px; padding: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
.actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 12px; }
button { padding: 8px 12px; border: 1px solid #ddd; background: #fff; border-radius: 6px; cursor: pointer; }
button.primary { background: #0b5; color: #fff; border-color: #0b5; }
</style>
