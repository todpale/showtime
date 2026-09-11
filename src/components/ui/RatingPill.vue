<template>
  <span
    :class="['rating', `rating--${size}`, { 'rating--muted': rating === null }]"
    :aria-label="label"
    data-test="show-card-rating"
  >
    <app-icon
      :size="size === 'lg' ? 12 : 9"
      name="star"
      filled
    />

    <span
      class="rating__score"
      v-text="text"
    />
  </span>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useLocale } from '@/locales'
import { ratingText } from '@/utils/format'
import AppIcon from '@/components/ui/AppIcon.vue'

defineOptions({ name: 'RatingPill' })

const props = withDefaults(defineProps<{
  size?: 'sm' | 'lg'
  rating: number | null
}>(), { size: 'sm' })

const { t } = useLocale()

const text = computed((): string => ratingText(props.rating))
const label = computed((): string => (props.rating === null ? t('show.unrated') : `${text.value} / 10`))
</script>

<style scoped>
.rating {
  display: inline-flex;
  gap: 3px;
  align-items: center;
  padding: 3px 7px;
  color: var(--ink);
  background: var(--accent);
  border-radius: var(--r-pill);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.01em;
  font-variant-numeric: tabular-nums;
}

.rating--lg {
  gap: var(--s-1);
  padding: 4px 10px;
  font-size: 12px;
}

.rating--muted {
  color: var(--ink-2);
  background: var(--surface-2);
}
</style>
