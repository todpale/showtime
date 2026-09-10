<template>
  <span
    :style="{ width, height }"
    class="skeleton"
    aria-hidden="true"
    data-test="skeleton-span"
  />
</template>

<script lang="ts" setup>
defineOptions({ name: 'SkeletonBlock' })

withDefaults(defineProps<{ width?: string, height?: string }>(), { width: '100%', height: '12px' })
</script>

<style scoped>
.skeleton {
  display: block;
  background: var(--surface-2);
  border-radius: var(--s-1);
  animation: pulse 1.4s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.55;
  }
}
</style>
