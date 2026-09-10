<template>
  <section
    v-if="items.length > 0"
    class="recent"
    data-test="recent-searches"
  >
    <div class="recent__head">
      <p
        class="u-eyebrow"
        v-text="t('search.recent')"
      />

      <button
        class="recent__clear"
        type="button"
        data-test="recent-clear-btn"
        @click="emit('on-clear')"
      >
        {{ t('action.clear') }}
      </button>
    </div>

    <ul class="recent__pills">
      <li
        v-for="(item, index) in items"
        :key="item"
      >
        <span
          :data-test="`recent-search-pill-${index}`"
          class="recent__pill"
        >
          <button
            class="recent__label"
            type="button"
            @click="emit('on-pick', item)"
          >
            {{ item }}
          </button>

          <button
            :aria-label="t('action.remove')"
            :data-test="`recent-search-remove-${index}`"
            class="recent__remove"
            type="button"
            @click="emit('on-remove', item)"
          >
            <app-icon
              :size="11"
              name="x"
            />
          </button>
        </span>
      </li>
    </ul>
  </section>
</template>

<script lang="ts" setup>
import { useLocale } from '@/locales'
import AppIcon from '@/components/ui/AppIcon.vue'

defineOptions({ name: 'RecentSearches' })

defineProps<{ items: string[] }>()
const emit = defineEmits<{
  'on-clear': []
  'on-pick': [string]
  'on-remove': [string]
}>()

const { t } = useLocale()
</script>

<style scoped>
.recent {
  display: flex;
  flex-direction: column;
  gap: var(--s-3);
}

.recent__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.recent__clear {
  color: var(--ink-2);
  font-size: 11px;
  font-weight: 600;
}

.recent__pills {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
}

.recent__pill {
  display: inline-flex;
  gap: 7px;
  align-items: center;
  padding: 7px 10px 7px 12px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-pill);
}

.recent__label {
  color: var(--ink-2);
  font-size: 12px;
  font-weight: 600;
}

.recent__remove {
  display: flex;
  align-items: center;
  color: var(--ink-2);
}
</style>
