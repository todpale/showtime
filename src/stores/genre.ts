import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { apiGet } from '@/utils/api'
import type { SortKey, GenrePage, LoadStatus, ShowSummary, CatalogFilters } from '@/models'

const PAGE_SIZE = 24
const EMPTY_FILTERS: CatalogFilters = { year: null, genre: null, minRating: null }

const useGenreStore = defineStore('genre', () => {
  const slug = ref('')
  const name = ref('')
  const total = ref(0)
  const matched = ref(0)
  const years = ref<number[]>([])
  const shows = ref<ShowSummary[]>([])
  const sort = ref<SortKey>('rating')
  const filters = ref<CatalogFilters>({ ...EMPTY_FILTERS })
  const status = ref<LoadStatus>('idle')
  const error = ref<string | null>(null)
  const moreStatus = ref<LoadStatus>('idle')
  const moreError = ref<string | null>(null)

  const canLoadMore = computed(() => shows.value.length < matched.value)
  const hasFilters = computed(() => filters.value.minRating !== null || filters.value.year !== null)

  async function fetchPage(offset: number): Promise<GenrePage> {
    return apiGet<GenrePage>(`/genres/${slug.value}`, {
      sort: sort.value,
      year: filters.value.year,
      limit: PAGE_SIZE,
      offset,
      minRating: filters.value.minRating
    })
  }

  async function reload(): Promise<void> {
    status.value = 'loading'
    error.value = null
    moreStatus.value = 'idle'
    moreError.value = null

    try {
      const page = await fetchPage(0)

      name.value = page.name
      total.value = page.total
      matched.value = page.matched
      years.value = page.years
      shows.value = page.shows
      status.value = 'ready'
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : String(cause)
      status.value = 'error'
    }
  }

  async function open(next: string): Promise<void> {
    if (slug.value === next && status.value === 'ready') {
      return
    }

    slug.value = next
    sort.value = 'rating'
    filters.value = { ...EMPTY_FILTERS }
    years.value = []
    shows.value = []
    moreStatus.value = 'idle'
    moreError.value = null

    await reload()
  }

  async function loadMore(): Promise<void> {
    if (!canLoadMore.value || status.value === 'loading' || moreStatus.value === 'loading') {
      return
    }

    moreStatus.value = 'loading'
    moreError.value = null

    try {
      const page = await fetchPage(shows.value.length)
      const seen = new Set(shows.value.map((show) => show.id))

      shows.value = [...shows.value, ...page.shows.filter((show) => !seen.has(show.id))]
      matched.value = page.matched
      moreStatus.value = 'ready'
    } catch (cause) {
      moreError.value = cause instanceof Error ? cause.message : String(cause)
      moreStatus.value = 'error'
    }
  }

  async function setSort(next: SortKey): Promise<void> {
    sort.value = next
    await reload()
  }

  async function setFilters(next: Partial<CatalogFilters>): Promise<void> {
    filters.value = { ...filters.value, ...next }
    await reload()
  }

  async function resetFilters(): Promise<void> {
    filters.value = { ...EMPTY_FILTERS }
    await reload()
  }

  return {
    name,
    slug,
    sort,
    total,
    years,
    shows,
    error,
    status,
    matched,
    filters,
    moreError,
    hasFilters,
    moreStatus,
    canLoadMore,
    open,
    reload,
    setSort,
    loadMore,
    setFilters,
    resetFilters
  }
})

export { useGenreStore }
