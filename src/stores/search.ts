import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { apiGet } from '@/utils/api'
import { readJson, writeJson } from '@/utils/storage'
import type { SortKey, LoadStatus, SearchResult, SearchResponse, CatalogFilters } from '@/models'

const RECENT_KEY = 'showtime.recent-searches'
const RECENT_MAX = 8
const DEBOUNCE_MS = 250
const EMPTY_FILTERS: CatalogFilters = { year: null, genre: null, minRating: null }

const useSearchStore = defineStore('search', () => {
  const query = ref('')
  const submitted = ref('')
  const results = ref<SearchResult[]>([])
  const recent = ref<string[]>(readJson<string[]>(RECENT_KEY, []))
  const sort = ref<SortKey>('relevance')
  const filters = ref<CatalogFilters>({ ...EMPTY_FILTERS })
  const status = ref<LoadStatus>('idle')
  const error = ref<string | null>(null)

  let timer: ReturnType<typeof setTimeout> | null = null
  let request = 0

  const topResult = computed(() => results.value[0] ?? null)
  const restResults = computed(() => results.value.slice(1))
  const hasQuery = computed(() => query.value.trim().length > 0)

  function rememberQuery(value: string): void {
    const trimmed = value.trim()

    if (!trimmed) {
      return
    }

    recent.value = [trimmed, ...recent.value.filter((entry) => entry !== trimmed)].slice(0, RECENT_MAX)
    writeJson(RECENT_KEY, recent.value)
  }

  function forgetQuery(value: string): void {
    recent.value = recent.value.filter((entry) => entry !== value)
    writeJson(RECENT_KEY, recent.value)
  }

  function clearRecent(): void {
    recent.value = []
    writeJson(RECENT_KEY, recent.value)
  }

  async function run(): Promise<void> {
    const term = query.value.trim()
    const ticket = ++request

    if (!term) {
      submitted.value = ''
      results.value = []
      status.value = 'idle'

      return
    }

    status.value = 'loading'
    error.value = null

    try {
      const response = await apiGet<SearchResponse>('/search', {
        q: term,
        sort: sort.value,
        year: filters.value.year,
        genre: filters.value.genre,
        minRating: filters.value.minRating
      })

      if (ticket !== request) {
        return
      }

      submitted.value = response.query
      results.value = response.results
      status.value = 'ready'
      rememberQuery(response.query)
    } catch (cause) {
      if (ticket !== request) {
        return
      }

      error.value = cause instanceof Error ? cause.message : String(cause)
      status.value = 'error'
    }
  }

  function setQuery(value: string): void {
    query.value = value

    if (timer !== null) {
      clearTimeout(timer)
    }

    timer = setTimeout(() => {
      timer = null
      run()
    }, DEBOUNCE_MS)
  }

  function clearQuery(): void {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }

    request += 1
    query.value = ''
    submitted.value = ''
    results.value = []
    status.value = 'idle'
    error.value = null
  }

  async function submit(value: string): Promise<void> {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }

    query.value = value

    await run()
  }

  async function setSort(next: SortKey): Promise<void> {
    sort.value = next

    await run()
  }

  async function setFilters(next: Partial<CatalogFilters>): Promise<void> {
    filters.value = { ...filters.value, ...next }

    await run()
  }

  return {
    sort,
    query,
    error,
    recent,
    status,
    filters,
    results,
    hasQuery,
    submitted,
    topResult,
    restResults,
    run,
    submit,
    setSort,
    setQuery,
    setFilters,
    clearQuery,
    forgetQuery,
    clearRecent
  }
})

export { useSearchStore }
