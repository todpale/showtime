<template>
  <aside
    class="sidebar"
    data-test="search-sidebar"
  >
    <recent-searches
      :items="search.recent"
      @on-pick="emit('on-pick', $event)"
      @on-remove="search.forgetQuery"
      @on-clear="search.clearRecent"
    />

    <section class="sidebar__block">
      <p
        class="u-eyebrow"
        v-text="t('filter.genre')"
      />

      <div class="sidebar__chips">
        <app-chip
          v-for="genre in genres"
          :key="genre.slug"
          :label="genre.name"
          :active="search.filters.genre === genre.slug"
          :data-test="`filter-chip-${genre.slug}`"
          @click="toggleGenre(genre.slug)"
        />
      </div>
    </section>

    <section class="sidebar__block">
      <rating-filter
        :model-value="search.filters.minRating"
        @update:model-value="search.setFilters({ minRating: $event })"
      />
    </section>

    <section
      v-if="trending.length > 0"
      class="sidebar__block"
    >
      <p
        class="u-eyebrow"
        v-text="t('search.trending')"
      />

      <ul
        class="sidebar__trend"
        data-test="search-trending"
      >
        <li
          v-for="(show, index) in trending"
          :key="show.id"
        >
          <router-link
            :to="{ name: 'show', params: { id: show.id } }"
            class="sidebar__trend-row"
          >
            <span
              class="sidebar__trend-index u-display"
              v-text="String(index + 1).padStart(2, '0')"
            />

            <span
              class="sidebar__trend-title"
              v-text="show.name"
            />

            <span
              class="sidebar__trend-score"
              v-text="ratingText(show.rating)"
            />
          </router-link>
        </li>
      </ul>
    </section>
  </aside>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useLocale } from '@/locales'
import { RouterLink } from 'vue-router'
import { ratingText } from '@/utils/format'
import { useSearchStore } from '@/stores/search'
import AppChip from '@/components/ui/AppChip.vue'
import { useCatalogStore } from '@/stores/catalog'
import type { ShowSummary, GenreSummary } from '@/models'
import RatingFilter from '@/components/genre/RatingFilter.vue'
import RecentSearches from '@/components/search/RecentSearches.vue'

defineOptions({ name: 'SearchSidebar' })

const emit = defineEmits<{
  'on-pick': [string]
}>()

const { t } = useLocale()
const search = useSearchStore()
const catalog = useCatalogStore()

const genres = computed((): GenreSummary[] => catalog.genres.slice(0, 8))

const trending = computed((): ShowSummary[] => (catalog.rows[0]?.shows ?? []).slice(0, 4))

function toggleGenre(slug: string): void {
  search.setFilters({ genre: search.filters.genre === slug ? null : slug })
}
</script>

<style scoped>
.sidebar {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: 30px;
  width: 320px;
}

.sidebar__block {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.sidebar__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
}

.sidebar__trend-row {
  display: flex;
  gap: 14px;
  align-items: center;
  padding: 11px 0;
  border-bottom: 1px solid var(--line);
}

.sidebar__trend-index {
  color: var(--ink-2);
  font-size: 20px;
}

.sidebar__trend-title {
  overflow: hidden;
  flex: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 600;
}

.sidebar__trend-score {
  color: var(--ink-2);
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
</style>
