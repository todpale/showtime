<template>
  <div
    class="genre"
    data-test="genre-view"
  >
    <header class="genre__head">
      <router-link
        :to="{ name: 'genres' }"
        class="genre__crumb"
        data-test="genre-breadcrumb"
      >
        <app-icon
          :size="14"
          name="chevronLeft"
        />

        <span v-text="t('genre.browse')" />
      </router-link>

      <h1
        class="genre__title u-display"
        data-test="genre-title"
      >
        {{ store.name || slug }}
      </h1>

      <p
        class="genre__sub"
        data-test="genre-subtitle"
        v-text="subtitle"
      />
    </header>

    <div class="genre__controls">
      <sort-control
        :model-value="store.sort"
        :options="sortOptions"
        @update:model-value="store.setSort"
      />

      <app-chip
        v-for="step in ratingChips"
        :key="step"
        :label="t('filter.rating', { min: step })"
        :active="store.filters.minRating === step"
        :data-test="`filter-chip-rating-${step}`"
        @click="toggleRating(step)"
      />

      <app-chip
        v-for="year in yearChips"
        :key="year"
        :label="String(year)"
        :active="store.filters.year === year"
        :data-test="`filter-chip-year-${year}`"
        @click="toggleYear(year)"
      />

      <p
        class="genre__showing"
        data-test="genre-showing"
        v-text="t('genre.showing', { shown: store.shows.length, total: store.matched })"
      />
    </div>

    <div
      v-if="store.status === 'loading'"
      class="genre__grid"
      data-test="genre-skeleton"
    >
      <skeleton-block
        v-for="index in 12"
        :key="index"
        height="210px"
      />
    </div>

    <state-block
      v-else-if="store.status === 'error'"
      :title="t('state.error')"
      :hint="store.error ?? t('state.hint')"
      variant="error"
      test="genre-error"
      retry
      @on-retry="store.reload()"
    />

    <state-block
      v-else-if="store.shows.length === 0"
      :title="t('genre.empty')"
      :action-label="t('action.reset')"
      test="genre-empty"
      retry
      @on-retry="store.resetFilters()"
    />

    <template v-else>
      <ul
        class="genre__grid"
        data-test="genre-grid"
      >
        <li
          v-for="show in store.shows"
          :key="show.id"
        >
          <show-card
            :show
            :genre="store.name"
          />
        </li>
      </ul>

      <button
        v-if="store.canLoadMore"
        :disabled="store.moreStatus === 'loading'"
        class="genre__more"
        type="button"
        data-test="genre-load-more-btn"
        @click="store.loadMore()"
      >
        {{ loadMoreLabel }}
      </button>

      <div
        v-if="store.moreStatus === 'error'"
        class="genre__more-error"
        data-test="genre-load-more-error"
      >
        <span
          class="genre__more-message"
          v-text="store.moreError ?? t('genre.moreError')"
        />

        <button
          class="genre__more-retry"
          type="button"
          data-test="genre-load-more-retry-btn"
          v-text="t('action.retry')"
          @click="store.loadMore()"
        />
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { useLocale } from '@/locales'
import type { SortOption } from '@/models'
import { useGenreStore } from '@/stores/genre'
import { watch, computed, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppChip from '@/components/ui/AppChip.vue'
import ShowCard from '@/components/show/ShowCard.vue'
import StateBlock from '@/components/ui/StateBlock.vue'
import SortControl from '@/components/ui/SortControl.vue'
import SkeletonBlock from '@/components/ui/SkeletonBlock.vue'

defineOptions({ name: 'GenreView' })

const RATING_CHIPS = [7, 8, 9]

const { t } = useLocale()
const route = useRoute()
const store = useGenreStore()

const slug = computed((): string => String(route.params.slug ?? ''))
const ratingChips = computed((): number[] => RATING_CHIPS)
const yearChips = computed((): number[] => store.years)

const sortOptions = computed((): SortOption[] => [
  { key: 'rating', label: t('sort.byRating') },
  { key: 'year', label: t('sort.byYear') },
  { key: 'name', label: t('sort.byName') }
])

const activeSortLabel = computed(
  (): string => sortOptions.value.find((option) => option.key === store.sort)?.label ?? ''
)

const loadMoreLabel = computed(
  (): string => (store.moreStatus === 'loading' ? t('state.loading') : t('action.loadMore'))
)

const subtitle = computed(
  (): string => t('genre.sorted', { count: store.matched, sort: activeSortLabel.value.toLowerCase() })
)

function toggleRating(step: number): void {
  store.setFilters({ minRating: store.filters.minRating === step ? null : step })
}

function toggleYear(year: number): void {
  store.setFilters({ year: store.filters.year === year ? null : year })
}

onMounted(() => {
  store.open(slug.value)
})

watch(slug, (value) => {
  store.open(value)
})
</script>

<style scoped>
.genre {
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
  padding: 10px var(--gutter) var(--s-6);
}

.genre__head {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.genre__crumb {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  align-self: flex-start;
  min-height: 32px;
  color: var(--ink-2);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
}

.genre__title {
  font-size: 48px;
  line-height: 1.02;
  letter-spacing: -0.025em;
}

.genre__sub {
  color: var(--ink-2);
  font-size: 12px;
}

.genre__controls {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  align-items: center;
}

.genre__showing {
  color: var(--ink-2);
  font-size: 12px;
}

.genre__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--s-4);
}

.genre__more {
  align-self: center;
  margin-top: var(--s-4);
  padding: 12px 28px;
  color: var(--ink);
  border: 1px solid var(--line);
  border-radius: var(--r-pill);
  font-size: 13px;
  font-weight: 600;
}

.genre__more:hover {
  background: var(--surface);
}

.genre__more:disabled {
  color: var(--ink-2);
  cursor: default;
  background: var(--surface);
}

.genre__more-error {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
  align-items: center;
  align-self: center;
  margin-top: var(--s-2);
  text-align: center;
}

.genre__more-message {
  color: var(--ink-2);
  font-size: 12px;
}

.genre__more-retry {
  min-height: 32px;
  padding: 0 var(--s-3);
  color: var(--ink);
  border: 1px solid var(--line);
  border-radius: var(--r-pill);
  font-size: 12px;
  font-weight: 600;
}

.genre__more-retry:hover {
  background: var(--surface);
}

@media (min-width: 900px) {
  .genre {
    gap: 28px;
    padding-top: 48px;
  }

  .genre__title {
    font-size: 88px;
    line-height: 1;
  }

  .genre__sub {
    font-size: 13px;
  }

  .genre__showing {
    margin-left: auto;
  }

  .genre__grid {
    grid-template-columns: repeat(6, 1fr);
    gap: 20px;
  }
}
</style>
