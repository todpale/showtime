<template>
  <svg
    :width="size"
    :height="size"
    :fill="filled ? 'currentColor' : 'none'"
    :stroke="filled ? 'none' : 'currentColor'"
    class="icon"
    viewBox="0 0 24 24"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
    v-html="ICON_PATHS[name]"
  />
</template>

<script lang="ts" setup>
import type { IconName } from '@/models'
import { ICON_PATHS } from '@/utils/icons'

defineOptions({ name: 'AppIcon' })

withDefaults(defineProps<{ size?: number, name: IconName, filled?: boolean }>(), {
  size: 16,
  filled: false
})
</script>

<style scoped>
.icon {
  display: block;
  flex: none;
}
</style>
