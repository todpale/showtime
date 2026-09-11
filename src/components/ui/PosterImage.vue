<template>
  <div
    :class="['poster', `poster--${ratio}`]"
    data-test="poster-div"
  >
    <img
      v-if="src && !isBroken"
      :src="src"
      :alt="alt"
      class="poster__img"
      loading="lazy"
      decoding="async"
      @error="isBroken = true"
    >

    <span
      v-else
      class="poster__fallback"
      data-test="poster-fallback-span"
      v-text="initials"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from 'vue'

defineOptions({ name: 'PosterImage' })

const props = withDefaults(
  defineProps<{
    alt: string
    src: string | null,
    ratio?: 'poster' | 'still'
  }>(),
  { ratio: 'poster' }
)

const isBroken = ref<boolean>(false)

const initials = computed((): string => props.alt.trim().slice(0, 1).toUpperCase())

watch(() => props.src, () => {
  isBroken.value = false
})
</script>

<style scoped>
.poster {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  background: var(--surface-2);
  border-radius: var(--r-card);
}

.poster--poster {
  aspect-ratio: 148 / 219;
}

.poster--still {
  aspect-ratio: 16 / 9;
  border-radius: var(--s-1);
}

.poster__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.poster__fallback {
  font-family: var(--font-display);
  font-size: 28px;
  color: var(--ink-2);
}
</style>
