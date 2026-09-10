import { slugify, compareShows } from './genres'
import type { SortKey, ShowSummary, CatalogFilters } from '@/models'

const SORTS: SortKey[] = ['rating', 'year', 'name', 'relevance']
const YEAR_FACET_LIMIT = 6

function toSort(value: unknown, fallback: SortKey = 'rating'): SortKey {
  return SORTS.includes(value as SortKey) ? value as SortKey : fallback
}

function toNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === '') {
    return null
  }

  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : null
}

function toFilters(query: Record<string, unknown>): CatalogFilters {
  return {
    year: toNumber(query.year),
    genre: typeof query.genre === 'string' && query.genre ? query.genre : null,
    minRating: toNumber(query.minRating)
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

    return !(filters.genre !== null && !show.genres.some((genre) => slugify(genre) === filters.genre))
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

  if (sort === 'relevance') {
    return sorted
  }

  return sorted.sort(compareShows)
}

export { toSort, toNumber, yearFacet, toFilters, sortShows, applyFilters, YEAR_FACET_LIMIT }
