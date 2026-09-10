import type { Page, Route } from '@playwright/test'
import type { Catalog, Failure, Latency } from './types'
import { slugify, buildCatalog, compareShows } from './catalog'
import type { SortKey, HomeFeed, GenrePage, ShowSummary, SearchResult, CatalogFilters, SearchResponse } from '@/models'

const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
)
const SORTS: SortKey[] = ['rating', 'year', 'name', 'relevance']
const YEAR_FACET_LIMIT = 6

function toNumber(value: string | null): number | null {
  if (value === null || value === '') {
    return null
  }

  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : null
}

function toSort(value: string | null, fallback: SortKey): SortKey {
  return SORTS.includes(value as SortKey) ? value as SortKey : fallback
}

function toFilters(params: URLSearchParams): CatalogFilters {
  return {
    year: toNumber(params.get('year')),
    genre: params.get('genre') || null,
    minRating: toNumber(params.get('minRating'))
  }
}

function applyFilters<T extends ShowSummary>(shows: T[], filters: CatalogFilters): T[] {
  return shows.filter((show) => {
    if (filters.minRating !== null && (show.rating ?? -1) < filters.minRating) {
      return false
    }

    if (filters.year !== null && show.year !== filters.year) {
      return false
    }

    return filters.genre === null || show.genres.some((genre) => slugify(genre) === filters.genre)
  })
}

function yearFacet<T extends ShowSummary>(shows: T[], filters: CatalogFilters, limit = YEAR_FACET_LIMIT): number[] {
  const matches = applyFilters(shows, { ...filters, year: null })
  const years = [...new Set(matches.map((show) => show.year))]
    .filter((year): year is number => year !== null)
    .sort((a, b) => b - a)

  const top = years.slice(0, Math.max(limit, 0))
  const active = filters.year

  if (active === null || top.includes(active)) {
    return top
  }

  return [...top.slice(0, Math.max(limit - 1, 0)), active].sort((a, b) => b - a)
}

function sortShows<T extends ShowSummary>(shows: T[], sort: SortKey): T[] {
  const sorted = [...shows]

  if (sort === 'year') {
    return sorted.sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || compareShows(a, b))
  }

  if (sort === 'name') {
    return sorted.sort((a, b) => a.name.localeCompare(b.name) || a.id - b.id)
  }

  return sort === 'relevance' ? sorted : sorted.sort(compareShows)
}

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

class ApiMock {
  catalog: Catalog
  latency: Latency = () => 0
  failures: Failure[] = []
  requests: URL[] = []
  unmocked: string[] = []
  pending = 0

  constructor(catalog: Catalog = buildCatalog()) {
    this.catalog = catalog
  }

  fail(pattern: RegExp, status = 500): void {
    this.failures.push({ pattern, status })
  }

  slow(pattern: RegExp, ms: number): void {
    const previous = this.latency

    this.latency = (url) => (pattern.test(url.pathname + url.search) ? ms : previous(url))
  }

  recover(): void {
    this.failures = []
  }

  requestsTo(path: string): URL[] {
    return this.requests.filter((url) => url.pathname === `/api/v1${path}`)
  }

  bucket(slug: string): ShowSummary[] {
    return this.catalog.shows.filter((show) => show.genres.some((genre) => slugify(genre) === slug)).sort(compareShows)
  }

  home(params: URLSearchParams): HomeFeed {
    const filters = toFilters(params)
    const perRow = Math.min(Math.max(toNumber(params.get('limit')) ?? 12, 1), 40)
    const maxRows = Math.min(Math.max(toNumber(params.get('rows')) ?? 8, 1), 20)
    const wanted = filters.genre
      ? this.catalog.genres.filter((genre) => genre.slug === filters.genre)
      : this.catalog.genres.slice(0, maxRows)
    const rows = wanted.flatMap((genre) => {
      const shows = applyFilters(this.bucket(genre.slug), { ...filters, genre: null })

      return shows.length === 0
        ? []
        : [{ name: genre.name, slug: genre.slug, total: shows.length, shows: shows.slice(0, perRow) }]
    })

    return { rows, spotlight: this.catalog.spotlight }
  }

  genre(slug: string, params: URLSearchParams): GenrePage | null {
    const genre = this.catalog.genres.find((entry) => entry.slug === slugify(slug))

    if (!genre) {
      return null
    }

    const all = this.bucket(genre.slug)
    const filters = { ...toFilters(params), genre: null }
    const filtered = applyFilters(all, filters)
    const matched = sortShows(filtered, toSort(params.get('sort'), 'rating'))
    const offset = Math.max(toNumber(params.get('offset')) ?? 0, 0)
    const limit = Math.min(Math.max(toNumber(params.get('limit')) ?? 24, 1), 100)

    return {
      name: genre.name,
      slug: genre.slug,
      total: all.length,
      matched: matched.length,
      years: yearFacet(all, filters),
      shows: matched.slice(offset, offset + limit)
    }
  }

  search(params: URLSearchParams): SearchResponse {
    const term = (params.get('q') ?? '').trim()

    if (!term) {
      return { query: '', total: 0, results: [] }
    }

    const needle = normalize(term)
    const hits: SearchResult[] = this.catalog.shows
      .filter((show) => normalize(show.name).includes(needle)
        || (this.catalog.keywords.get(show.id) ?? []).some((keyword) => normalize(keyword) === needle))
      .map((show) => {
        const meta = this.catalog.search.get(show.id) ?? { score: 0, summary: '' }

        return { ...show, score: meta.score, summary: meta.summary, seasonCount: null }
      })
      .sort((a, b) => b.score - a.score)
    const results = sortShows(applyFilters(hits, toFilters(params)), toSort(params.get('sort'), 'relevance'))

    return { query: term, total: results.length, results }
  }

  resolve(url: URL): { body?: unknown, status: number } {
    const path = url.pathname.replace(/^\/api\/v1/, '')
    const show = /^\/shows\/(\d+)$/.exec(path)
    const episodes = /^\/shows\/(\d+)\/episodes$/.exec(path)
    const genre = /^\/genres\/([^/]+)$/.exec(path)

    if (path === '/home') {
      return { status: 200, body: this.home(url.searchParams) }
    }

    if (path === '/genres') {
      return { status: 200, body: this.catalog.genres }
    }

    if (path === '/search') {
      return { status: 200, body: this.search(url.searchParams) }
    }

    if (show?.[1]) {
      const detail = this.catalog.details.get(Number(show[1]))

      return detail ? { status: 200, body: detail } : { status: 404, body: { message: 'Not Found' } }
    }

    if (episodes?.[1]) {
      const groups = this.catalog.episodes.get(Number(episodes[1]))

      return groups ? { status: 200, body: groups } : { status: 404, body: { message: 'Not Found' } }
    }

    if (genre?.[1]) {
      const page = this.genre(decodeURIComponent(genre[1]), url.searchParams)

      return page ? { status: 200, body: page } : { status: 404, body: { message: 'Not Found' } }
    }

    this.unmocked.push(url.pathname + url.search)
    console.error(`[e2e] unmocked /api/v1 request: ${url.pathname}${url.search}`)

    return { status: 500, body: { message: `Unmocked e2e request: ${url.pathname}` } }
  }

  async handle(route: Route): Promise<void> {
    const url = new URL(route.request().url())
    const failure = this.failures.find((entry) => entry.pattern.test(url.pathname + url.search))
    const wait = this.latency(url)

    this.requests.push(url)
    this.pending += 1

    try {
      if (wait > 0) {
        await delay(wait)
      }

      if (failure) {
        await route.fulfill({ status: failure.status, json: { message: 'Injected failure' } })

        return
      }

      const { status, body } = this.resolve(url)

      await route.fulfill({ status, json: body })
    } finally {
      this.pending -= 1
    }
  }
}

async function installApi(page: Page, api: ApiMock): Promise<void> {
  await page.route('**/api/v1/**', (route) => api.handle(route))
  await page.route('https://example.test/**', (route) => route.fulfill({
    status: 200,
    contentType: 'image/png',
    body: PIXEL
  }))
}

export { ApiMock, yearFacet, installApi }
