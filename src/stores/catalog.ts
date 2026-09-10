import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { apiGet } from '@/utils/api'
import type { HomeFeed, GenreRow, LoadStatus, ShowSummary, GenreSummary, CatalogFilters } from '@/models'

const EMPTY_FILTERS: CatalogFilters = { year: null, genre: null, minRating: null }

const useCatalogStore = defineStore('catalog', () => {
  const rows = ref<GenreRow[]>([])
  const genres = ref<GenreSummary[]>([])
  const spotlight = ref<ShowSummary | null>(null)
  const status = ref<LoadStatus>('idle')
  const error = ref<string | null>(null)
  const filters = ref<CatalogFilters>({ ...EMPTY_FILTERS })
  const filtersOpen = ref<boolean>(false)

  let request = 0

  const activeGenre = computed(() => filters.value.genre)
  const hasFilters = computed(() => filters.value.minRating !== null || filters.value.year !== null)

  function openFilters(): void {
    filtersOpen.value = true
  }

  function closeFilters(): void {
    filtersOpen.value = false
  }

  async function loadGenres(): Promise<void> {
    if (genres.value.length > 0) {
      return
    }

    genres.value = await apiGet<GenreSummary[]>('/genres')
  }

  async function load(): Promise<void> {
    const ticket = ++request

    status.value = 'loading'
    error.value = null

    try {
      const [feed] = await Promise.all([
        apiGet<HomeFeed>('/home', {
          genre: filters.value.genre,
          year: filters.value.year,
          minRating: filters.value.minRating
        }),
        loadGenres()
      ])

      if (ticket !== request) {
        return
      }

      rows.value = feed.rows
      spotlight.value = feed.spotlight
      status.value = 'ready'
    } catch (cause) {
      if (ticket !== request) {
        return
      }

      error.value = cause instanceof Error ? cause.message : String(cause)
      status.value = 'error'
    }
  }

  async function selectGenre(slug: string | null): Promise<void> {
    filters.value.genre = slug
    await load()
  }

  async function applyFilters(next: Partial<CatalogFilters>): Promise<void> {
    filters.value = { ...filters.value, ...next }
    await load()
  }

  async function resetFilters(): Promise<void> {
    filters.value = { ...EMPTY_FILTERS, genre: filters.value.genre }
    await load()
  }

  return {
    rows,
    error,
    status,
    genres,
    filters,
    spotlight,
    hasFilters,
    activeGenre,
    filtersOpen,
    load,
    loadGenres,
    openFilters,
    selectGenre,
    closeFilters,
    resetFilters,
    applyFilters
  }
})

export { useCatalogStore }
