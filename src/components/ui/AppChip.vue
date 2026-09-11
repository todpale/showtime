<template>
  <component
    :is="to ? RouterLink : 'button'"
    :to
    :type="to ? undefined : 'button'"
    :class="['chip', { 'chip--active': active }]"
    :aria-pressed="to ? undefined : active"
  >
    <span class="chip__body">
      <slot>{{ label }}</slot>

      <app-icon
        v-if="dismissable"
        :size="11"
        name="x"
      />
    </span>
  </component>
</template>

<script lang="ts" setup>
import { RouterLink } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import type { RouteLocationRaw } from 'vue-router'

defineOptions({ name: 'AppChip' })

withDefaults(
  defineProps<{
    label?: string,
    active?: boolean,
    dismissable?: boolean,
    to?: RouteLocationRaw
  }>(),
  {
    label: '',
    active: false,
    dismissable: false,
    to: undefined
  }
)
</script>

<style scoped>
.chip {
  display: inline-flex;
  flex: none;
  margin: -7px 0;
  padding: 7px 0;
  color: var(--ink-2);
  white-space: nowrap;
  border-radius: var(--r-pill);
}

.chip__body {
  display: inline-flex;
  gap: 7px;
  align-items: center;
  min-height: 30px;
  padding: 7px 14px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-pill);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.01em;
  transition: color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease;
}

.chip:hover {
  color: var(--ink);
}

.chip:hover .chip__body {
  border-color: var(--ink-2);
}

.chip--active .chip__body,
.chip--active:hover .chip__body {
  color: var(--ink-inv);
  background: var(--ink);
  border-color: var(--ink);
}
</style>
