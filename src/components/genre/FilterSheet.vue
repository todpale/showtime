<template>
  <div
    class="sheet"
    data-test="filter-sheet"
  >
    <button
      :aria-label="t('action.close')"
      class="sheet__scrim"
      type="button"
      data-test="filter-sheet-scrim-btn"
      @click="emit('on-close')"
    />

    <div
      :aria-label="t('filter.name')"
      class="sheet__panel"
      role="dialog"
      aria-modal="true"
    >
      <div class="sheet__head">
        <h2
          class="sheet__title"
          v-text="t('filter.name')"
        />

        <button
          ref="closeButton"
          :aria-label="t('action.close')"
          class="sheet__close"
          type="button"
          data-test="filter-close-btn"
          @click="emit('on-close')"
        >
          <app-icon
            :size="16"
            name="x"
          />
        </button>
      </div>

      <rating-filter
        :model-value="catalog.filters.minRating"
        @update:model-value="onRating"
      />

      <div class="sheet__group">
        <p
          class="u-eyebrow"
          v-text="t('filter.genre')"
        />

        <div class="sheet__chips">
          <app-chip
            :label="t('genre.all')"
            :active="catalog.activeGenre === null"
            data-test="filter-chip-all"
            @click="onGenre(null)"
          />

          <app-chip
            v-for="genre in catalog.genres.slice(0, 12)"
            :key="genre.slug"
            :label="genre.name"
            :active="catalog.activeGenre === genre.slug"
            :data-test="`filter-chip-${genre.slug}`"
            @click="onGenre(genre.slug)"
          />
        </div>
      </div>

      <button
        class="sheet__reset"
        type="button"
        data-test="filter-reset-btn"
        @click="onReset"
      >
        {{ t('action.reset') }}
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useLocale } from '@/locales'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppChip from '@/components/ui/AppChip.vue'
import { useCatalogStore } from '@/stores/catalog'
import { ref, nextTick, onMounted, onUnmounted } from 'vue'
import RatingFilter from '@/components/genre/RatingFilter.vue'

defineOptions({ name: 'FilterSheet' })

const emit = defineEmits<{
  (e: 'on-close'): void
}>()

const { t } = useLocale()
const catalog = useCatalogStore()

const closeButton = ref<HTMLButtonElement | null>(null)

function onRating(value: number | null): void {
  catalog.applyFilters({ minRating: value })
}

function onGenre(slug: string | null): void {
  catalog.selectGenre(slug)
}

function onReset(): void {
  catalog.resetFilters()
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    emit('on-close')
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)

  nextTick(() => {
    closeButton.value?.focus()
  })
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.sheet {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: flex-end;
}

.sheet__scrim {
  position: absolute;
  inset: 0;
  background: rgb(16 16 16 / 45%);
}

.sheet__panel {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--s-5);
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  padding: var(--s-5);
  background: var(--bg);
  border-radius: var(--s-4) var(--s-4) 0 0;
}

.sheet__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sheet__title {
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 400;
}

.sheet__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: var(--ink-2);
  background: var(--surface);
  border-radius: var(--r-pill);
  transition: scale 0.15s ease;
}

.sheet__close:active {
  scale: 0.96;
}

.sheet__group {
  display: flex;
  flex-direction: column;
  gap: var(--s-3);
}

.sheet__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
}

.sheet__reset {
  align-self: flex-start;
  color: var(--ink-2);
  font-size: 13px;
  font-weight: 600;
  text-decoration: underline;
}

@media (min-width: 900px) {
  .sheet {
    align-items: center;
    justify-content: center;
  }

  .sheet__panel {
    max-width: 460px;
    border-radius: var(--s-3);
  }
}
</style>
