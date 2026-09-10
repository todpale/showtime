<template>
  <div
    class="tabs"
    role="tablist"
  >
    <button
      v-for="item in tabs"
      :key="item.key"
      :class="['tabs__tab', { 'tabs__tab--active': item.key === modelValue }]"
      :aria-selected="item.key === modelValue"
      :data-test="`detail-tab-${item.key}`"
      type="button"
      role="tab"
      @click="emit('update:modelValue', item.key)"
    >
      {{ item.label }}
    </button>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useLocale } from '@/locales'
import type { ShowTab, DetailTab } from '@/models'

defineOptions({ name: 'ShowTabs' })

defineProps<{ modelValue: DetailTab }>()
const emit = defineEmits<{
  'update:modelValue': [DetailTab]
}>()

const { t } = useLocale()

const tabs = computed((): ShowTab[] => [
  { key: 'episodes', label: t('episode.name', 2) },
  { key: 'details', label: t('show.detail') },
  { key: 'cast', label: t('show.cast') },
  { key: 'similar', label: t('show.similar') }
])
</script>

<style scoped>
.tabs {
  display: flex;
  gap: 26px;
  overflow-x: auto;
  padding: 18px var(--gutter) 0;
  border-bottom: 1px solid var(--line);
  scrollbar-width: none;
}

.tabs::-webkit-scrollbar {
  display: none;
}

.tabs__tab {
  min-width: 44px;
  margin-top: -15px;
  padding-top: 15px;
  padding-bottom: 9px;
  color: var(--ink-2);
  text-align: center;
  white-space: nowrap;
  border-bottom: 2px solid transparent;
  font-size: 13px;
}

.tabs__tab--active {
  color: var(--ink);
  border-bottom-color: var(--ink);
  font-weight: 600;
}

@media (min-width: 900px) {
  .tabs {
    gap: 36px;
    height: 56px;
    padding-top: 0;
    align-items: flex-end;
  }

  .tabs__tab {
    padding-bottom: 16px;
    font-size: 14px;
  }
}
</style>
