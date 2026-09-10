<template>
  <div class="rating-filter">
    <p
      class="u-eyebrow"
      v-text="t('filter.minRating')"
    />

    <div
      class="rating-filter__seg"
      role="group"
    >
      <button
        v-for="step in steps"
        :key="String(step.value)"
        :class="['rating-filter__btn', { 'rating-filter__btn--active': step.value === modelValue }]"
        :aria-pressed="step.value === modelValue"
        :data-test="`filter-rating-${step.value ?? 'any'}`"
        type="button"
        @click="emit('update:modelValue', step.value)"
      >
        {{ step.label }}
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useLocale } from '@/locales'
import type { RatingStep } from '@/models'

defineOptions({ name: 'RatingFilter' })

defineProps<{ modelValue: number | null }>()
const emit = defineEmits<{ 'update:modelValue': [number | null] }>()

const { t } = useLocale()

const steps = computed((): RatingStep[] => [
  { value: null, label: t('filter.any') },
  { value: 7, label: '7+' },
  { value: 8, label: '8+' },
  { value: 9, label: '9+' }
])
</script>

<style scoped>
.rating-filter {
  display: flex;
  flex-direction: column;
  gap: var(--s-3);
}

.rating-filter__seg {
  display: flex;
  gap: var(--s-1);
  padding: var(--s-1);
  background: var(--surface);
  border-radius: var(--r-pill);
}

.rating-filter__btn {
  flex: 1;
  min-height: 34px;
  color: var(--ink-2);
  border-radius: var(--r-pill);
  font-size: 12px;
}

.rating-filter__btn--active {
  color: var(--ink);
  background: var(--bg);
  font-weight: 600;
}
</style>
