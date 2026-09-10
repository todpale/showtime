<template>
  <div
    :class="['state', `state--${variant}`]"
    :data-test="test"
    role="status"
  >
    <p
      class="state__title"
      v-text="title"
    />

    <p
      v-if="hint"
      class="state__hint"
      v-text="hint"
    />

    <button
      v-if="retry"
      class="state__action"
      type="button"
      data-test="state-retry-btn"
      @click="emit('on-retry')"
    >
      {{ actionLabel || t('action.retry') }}
    </button>
  </div>
</template>

<script lang="ts" setup>
import { useLocale } from '@/locales'

defineOptions({ name: 'StateBlock' })

withDefaults(
  defineProps<{
    title: string
    hint?: string
    test?: string
    retry?: boolean
    actionLabel?: string
    variant?: 'plain' | 'error'
  }>(),
  { hint: '', variant: 'plain', retry: false, test: 'state-div', actionLabel: '' }
)

const emit = defineEmits<{
  (e: 'on-retry'): void
}>()

const { t } = useLocale()
</script>

<style scoped>
.state {
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
  align-items: flex-start;
  padding: var(--s-5);
  background: var(--surface);
  border-radius: var(--r-card);
}

.state--error {
  background: var(--surface);
  border: 1px solid var(--line);
}

.state__title {
  font-size: 15px;
  font-weight: 600;
}

.state__hint {
  color: var(--ink-2);
  font-size: 13px;
}

.state__action {
  margin-top: var(--s-1);
  padding: 9px 18px;
  color: var(--ink-inv);
  background: var(--ink);
  border-radius: var(--r-pill);
  font-size: 13px;
  font-weight: 600;
}
</style>
