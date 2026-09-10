<template>
  <div class="season">
    <label
      class="u-visually-hidden"
      for="season-select"
    >{{ t('show.season', { number: modelValue }) }}</label>

    <div class="season__control">
      <select
        id="season-select"
        :value="modelValue"
        class="season__select"
        data-test="detail-season-select"
        @change="onChange"
      >
        <option
          v-for="value in seasons"
          :key="value"
          :value="value"
        >
          {{ t('show.season', { number: value }) }}
        </option>
      </select>

      <app-icon
        :size="14"
        name="chevronDown"
      />
    </div>

    <p
      class="season__count"
      data-test="detail-episode-count"
      v-text="t('episode.count', { count }, count)"
    />
  </div>
</template>

<script lang="ts" setup>
import { useLocale } from '@/locales'
import AppIcon from '@/components/ui/AppIcon.vue'

defineOptions({ name: 'SeasonSelect' })

defineProps<{ count: number; seasons: number[], modelValue: number }>()
const emit = defineEmits<{ 'update:modelValue': [number] }>()

const { t } = useLocale()

function onChange(event: Event): void {
  emit('update:modelValue', Number((event.target as HTMLSelectElement).value))
}
</script>

<style scoped>
.season {
  display: flex;
  gap: 14px;
  align-items: center;
  justify-content: space-between;
}

.season__control {
  position: relative;
  display: flex;
  gap: 7px;
  align-items: center;
  padding: 7px 12px;
  background: var(--surface);
  border-radius: var(--s-2);
}

.season__select {
  appearance: none;
  padding: 0;
  padding-right: var(--s-1);
  color: inherit;
  background: none;
  border: 0;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.season__count {
  color: var(--ink-2);
  font-size: 12px;
}
</style>
