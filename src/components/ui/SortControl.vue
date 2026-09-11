<template>
  <div class="sort">
    <button
      :aria-expanded="isOpened"
      class="sort__toggle"
      type="button"
      aria-haspopup="listbox"
      data-test="sort-control"
      @click="isOpened = !isOpened"
    >
      <span class="sort__pill">
        <app-icon
          :size="13"
          name="sortDescending"
        />

        <span v-text="t('sort.label', { sort: activeLabel })" />
      </span>
    </button>

    <ul
      v-if="isOpened"
      class="sort__menu"
      role="listbox"
    >
      <li
        v-for="option in options"
        :key="option.key"
      >
        <button
          :class="['sort__option', { 'sort__option--active': option.key === tempModel }]"
          :aria-selected="option.key === tempModel"
          :data-test="`sort-option-${option.key}`"
          type="button"
          role="option"
          @click="handleSelect(option.key)"
        >
          {{ option.label }}
        </button>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useLocale } from '@/locales'
import AppIcon from '@/components/ui/AppIcon.vue'
import type { SortKey, SortOption } from '@/models'

defineOptions({ name: 'SortControl' })

const props = defineProps<{ options: SortOption[] }>()
const emits = defineEmits<{ 'update:modelValue': [SortKey] }>()

const { t } = useLocale()

const tempModel = defineModel<SortKey>()

const isOpened = ref<boolean>(false)

const activeLabel = computed((): string => {
  return props.options.find((option) => option.key === tempModel.value)?.label ?? ''
})

function handleSelect(key: SortKey): void {
  isOpened.value = false
  emits('update:modelValue', key)
}
</script>

<style scoped>
.sort {
  position: relative;
}

.sort__toggle {
  display: inline-flex;
  margin: -5px 0;
  padding: 5px 0;
  white-space: nowrap;
  border-radius: var(--r-pill);
}

.sort__pill {
  display: inline-flex;
  gap: 7px;
  align-items: center;
  min-height: 34px;
  padding: 9px 15px;
  color: var(--ink-inv);
  background: var(--ink);
  border-radius: var(--r-pill);
  font-size: 12px;
  font-weight: 600;
}

.sort__menu {
  position: absolute;
  top: calc(100% + var(--s-2));
  left: 0;
  z-index: 20;
  min-width: 180px;
  padding: var(--s-1);
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: var(--s-2);
  box-shadow: 0 12px 32px rgb(16 16 16 / 12%);
}

.sort__option {
  width: 100%;
  padding: 9px 12px;
  text-align: left;
  border-radius: var(--s-1);
  font-size: 13px;
}

.sort__option:hover {
  background: var(--surface);
}

.sort__option--active {
  font-weight: 600;
}
</style>
