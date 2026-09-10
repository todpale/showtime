<template>
  <div
    class="search"
    data-test="search-view"
  >
    <div class="search__bar">
      <button
        v-if="!desktop"
        :aria-label="t('action.back')"
        class="search__back"
        type="button"
        data-test="search-back-btn"
        @click="goBack"
      >
        <app-icon
          :size="22"
          name="arrowLeft"
        />
      </button>

      <search-field
        :model-value="searchStore.query"
        @update:model-value="onInput"
        @on-clear="onClear"
      />
    </div>

    <div class="search__body">
      <div class="search__main">
        <recent-searches
          v-if="!desktop && searchStore.recent.length > 0"
          :items="searchStore.recent"
          @on-pick="pick"
          @on-remove="searchStore.forgetQuery"
          @on-clear="searchStore.clearRecent"
        />

        <div
          v-if="!desktop && searchStore.recent.length > 0"
          class="search__rule"
        />

        <template v-if="searchStore.hasQuery">
          <div class="search__head">
            <h1
              class="search__count"
              data-test="search-count"
              v-text="heading"
            />

            <sort-control
              :model-value="searchStore.sort"
              :options="sortOptions"
              @update:model-value="searchStore.setSort"
            />
          </div>

          <div
            v-if="searchStore.status === 'loading'"
            class="search__skeleton"
            data-test="search-skeleton"
          >
            <skeleton-block
              v-for="index in 4"
              :key="index"
              height="78px"
            />
          </div>

          <state-block
            v-else-if="searchStore.status === 'error'"
            :title="t('state.error')"
            :hint="searchStore.error ?? t('state.hint')"
            variant="error"
            test="search-error"
            retry
            @on-retry="searchStore.run()"
          />

          <state-block
            v-else-if="searchStore.status === 'ready' && searchStore.results.length === 0"
            :title="t('search.empty', { query: searchStore.submitted })"
            :hint="t('search.hint')"
            test="search-empty"
          />

          <template v-else>
            <top-result
              v-if="searchStore.topResult"
              :result="searchStore.topResult"
            />

            <ul
              v-if="searchStore.restResults.length > 0"
              class="search__rows"
            >
              <li
                v-for="(result, index) in searchStore.restResults"
                :key="result.id"
              >
                <result-row
                  :result="result"
                  :index="index + 1"
                />
              </li>
            </ul>
          </template>
        </template>

        <state-block
          v-else-if="desktop"
          :title="t('search.placeholder')"
          :hint="t('search.hint')"
          test="search-idle"
        />
      </div>

      <search-sidebar
        v-if="desktop"
        @on-pick="pick"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useLocale } from '@/locales'
import type { SortOption } from '@/models'
import { watch, computed, onMounted } from 'vue'
import { useSearchStore } from '@/stores/search'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import { useCatalogStore } from '@/stores/catalog'
import StateBlock from '@/components/ui/StateBlock.vue'
import { useDesktop } from '@/composables/useMediaQuery'
import SortControl from '@/components/ui/SortControl.vue'
import TopResult from '@/components/search/TopResult.vue'
import ResultRow from '@/components/search/ResultRow.vue'
import SkeletonBlock from '@/components/ui/SkeletonBlock.vue'
import SearchField from '@/components/search/SearchField.vue'
import SearchSidebar from '@/components/search/SearchSidebar.vue'
import RecentSearches from '@/components/search/RecentSearches.vue'

defineOptions({ name: 'SearchView' })

const { t } = useLocale()
const route = useRoute()
const router = useRouter()
const searchStore = useSearchStore()
const catalogStore = useCatalogStore()
const desktop = useDesktop()

const sortOptions = computed((): SortOption[] => [
  { key: 'relevance', label: t('sort.byRelevance') },
  { key: 'rating', label: t('sort.byRating') },
  { key: 'year', label: t('sort.byYear') },
  { key: 'name', label: t('sort.byName') }
])

const heading = computed((): string => (searchStore.status === 'ready'
  ? t('search.result', { count: searchStore.results.length, query: searchStore.submitted }, searchStore.results.length)
  : t('state.loading')))

function syncUrl(value: string): void {
  router.replace({ name: 'search', query: value ? { q: value } : {} })
}

function onInput(value: string): void {
  searchStore.setQuery(value)
  syncUrl(value.trim())
}

function onClear(): void {
  searchStore.clearQuery()
  syncUrl('')
}

function pick(value: string): void {
  searchStore.submit(value)
  syncUrl(value)
}

function goBack(): void {
  if (window.history.state?.back) {
    router.back()

    return
  }

  router.push({ name: 'home' })
}

onMounted(() => {
  const initial = typeof route.query.q === 'string' ? route.query.q : ''

  catalogStore.loadGenres()

  if (catalogStore.rows.length === 0) {
    catalogStore.load()
  }

  if (initial && initial !== searchStore.submitted) {
    searchStore.submit(initial)
  }
})

watch(() => route.query.q, (value) => {
  const next = typeof value === 'string' ? value : ''

  if (next && next !== searchStore.query) {
    searchStore.submit(next)
  }
})
</script>

<style scoped>
.search {
  display: flex;
  flex-direction: column;
  padding-bottom: var(--s-6);
}

.search__bar {
  display: flex;
  gap: 14px;
  align-items: center;
  padding: 14px var(--gutter);
}

.search__back {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
}

.search__body {
  display: flex;
  gap: 56px;
  padding: 0 var(--gutter);
}

.search__main {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.search__rule {
  height: 1px;
  margin: var(--s-1) 0;
  background: var(--line);
}

.search__head {
  display: flex;
  gap: var(--s-4);
  align-items: center;
  justify-content: space-between;
}

.search__count {
  color: var(--ink-2);
  text-transform: uppercase;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.search__skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--s-3);
}

@media (min-width: 900px) {
  .search__bar {
    display: none;
  }

  .search__body {
    padding-top: var(--s-6);
  }

  .search__main {
    gap: 22px;
  }

  .search__head {
    align-items: flex-end;
  }

  .search__count {
    color: var(--ink);
    text-transform: none;
    font-family: var(--font-display);
    font-size: 36px;
    font-weight: 400;
    letter-spacing: -0.01em;
  }
}
</style>
