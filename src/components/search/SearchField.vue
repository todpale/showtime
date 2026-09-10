<template>
  <div class="field">
    <app-icon
      :size="16"
      name="search"
    />

    <input
      ref="input"
      :value="modelValue"
      :placeholder="t('search.placeholder')"
      :aria-label="t('search.placeholder')"
      class="field__input"
      type="search"
      data-test="search-input"
      @input="onInput"
    >

    <button
      v-if="modelValue"
      :aria-label="t('action.clear')"
      class="field__clear"
      type="button"
      data-test="search-clear-btn"
      @click="onClear"
    >
      <span class="field__clear-dot">
        <app-icon
          :size="10"
          name="x"
        />
      </span>
    </button>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useLocale } from '@/locales'
import AppIcon from '@/components/ui/AppIcon.vue'

defineOptions({ name: 'SearchField' })

defineProps<{ modelValue: string }>()
const emit = defineEmits<{
  'on-clear': []
  'update:modelValue': [string]
}>()

const { t } = useLocale()
const input = ref<HTMLInputElement | null>(null)

function onInput(event: Event): void {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}

function onClear(): void {
  emit('on-clear')
  input.value?.focus()
}

onMounted(() => {
  input.value?.focus()
})
</script>

<style scoped>
.field {
  display: flex;
  flex: 1;
  gap: 10px;
  align-items: center;
  min-width: 0;
  padding: 10px 14px;
  color: var(--ink-2);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-pill);
}

.field:focus-within {
  border-color: var(--ink-2);
}

.field__input {
  width: 100%;
  min-width: 0;
  color: var(--ink);
  background: none;
  border: 0;
  font-size: 15px;
  font-weight: 600;
}

.field__input:focus {
  outline: none;
}

.field__input::-webkit-search-cancel-button {
  display: none;
}

.field__clear {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  margin: -13px -13px -13px 0;
  color: var(--ink-2);
  border-radius: var(--r-pill);
}

.field__clear-dot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background: var(--surface-2);
  border-radius: var(--r-pill);
}
</style>
