import { apiGet } from '@/utils/api'
import { makeShow } from '@/__tests__/fixtures'
import { useCatalogStore } from '@/stores/catalog'
import { createPinia, setActivePinia } from 'pinia'
import type { HomeFeed, GenreSummary } from '@/models'
import { vi, it, expect, describe, beforeEach } from 'vitest'

vi.mock('@/utils/api', () => ({ apiGet: vi.fn(), toQuery: vi.fn(() => '') }))

const apiGetMock = vi.mocked(apiGet)

const testGenres: GenreSummary[] = [
  { name: 'Drama', slug: 'drama', total: 120 },
  { name: 'Comedy', slug: 'comedy', total: 90 }
]

const testFeed: HomeFeed = {
  rows: [{ name: 'Drama', slug: 'drama', total: 120, shows: [makeShow({ id: 1 })] }],
  spotlight: makeShow({ id: 2 })
}

function serveCatalog(feed: HomeFeed = testFeed): void {
  apiGetMock.mockImplementation((path: string) => {
    if (path === '/genres') {
      return Promise.resolve(testGenres)
    }

    return Promise.resolve(feed)
  })
}

function homeParams(): Record<string, unknown> {
  const calls = apiGetMock.mock.calls.filter(([path]) => path === '/home')
  const call = calls[calls.length - 1]

  return (call?.[1] ?? {}) as Record<string, unknown>
}

describe('catalog store', () => {
  beforeEach(() => {
    apiGetMock.mockReset()
    setActivePinia(createPinia())
  })

  it('starts idle with nothing loaded', () => {
    const catalog = useCatalogStore()

    expect(catalog.status).toBe('idle')
    expect(catalog.rows).toEqual([])
    expect(catalog.spotlight).toBeNull()
    expect(catalog.hasFilters).toBe(false)
    expect(catalog.activeGenre).toBeNull()
    expect(catalog.filtersOpen).toBe(false)
  })

  it('opens and closes the filter sheet from anywhere in the app', () => {
    const catalog = useCatalogStore()

    catalog.openFilters()

    expect(catalog.filtersOpen).toBe(true)

    catalog.closeFilters()

    expect(catalog.filtersOpen).toBe(false)
  })

  it('stays open when the filters are opened twice', () => {
    const catalog = useCatalogStore()

    catalog.openFilters()
    catalog.openFilters()

    expect(catalog.filtersOpen).toBe(true)

    catalog.closeFilters()
    catalog.closeFilters()

    expect(catalog.filtersOpen).toBe(false)
  })

  it('leaves the sheet open while the filters are being changed', async () => {
    serveCatalog()

    const catalog = useCatalogStore()

    catalog.openFilters()

    await catalog.selectGenre('drama')
    await catalog.applyFilters({ minRating: 8 })
    await catalog.resetFilters()

    expect(catalog.filtersOpen).toBe(true)
  })

  it('moves from loading to ready and exposes the feed', async () => {
    serveCatalog()

    const catalog = useCatalogStore()
    const pending = catalog.load()

    expect(catalog.status).toBe('loading')

    await pending

    expect(catalog.status).toBe('ready')
    expect(catalog.rows).toEqual(testFeed.rows)
    expect(catalog.spotlight).toEqual(testFeed.spotlight)
    expect(catalog.genres).toEqual(testGenres)
    expect(catalog.error).toBeNull()
  })

  it('reports an error when the feed cannot be loaded', async () => {
    apiGetMock.mockRejectedValue(new Error('TVmaze is unreachable'))

    const catalog = useCatalogStore()

    await catalog.load()

    expect(catalog.status).toBe('error')
    expect(catalog.error).toBe('TVmaze is unreachable')
  })

  it('clears a previous error on the next successful load', async () => {
    apiGetMock.mockRejectedValue(new Error('Boom'))

    const catalog = useCatalogStore()

    await catalog.load()
    serveCatalog()
    await catalog.load()

    expect(catalog.error).toBeNull()
    expect(catalog.status).toBe('ready')
  })

  it('fetches the genre list only once', async () => {
    serveCatalog()

    const catalog = useCatalogStore()

    await catalog.loadGenres()
    await catalog.loadGenres()

    expect(apiGetMock.mock.calls.filter(([path]) => path === '/genres')).toHaveLength(1)
  })

  it('reloads the feed for the selected genre', async () => {
    serveCatalog()

    const catalog = useCatalogStore()

    await catalog.selectGenre('comedy')

    expect(catalog.activeGenre).toBe('comedy')
    expect(homeParams().genre).toBe('comedy')
  })

  it('goes back to every genre when the selection is cleared', async () => {
    serveCatalog()

    const catalog = useCatalogStore()

    await catalog.selectGenre('comedy')
    await catalog.selectGenre(null)

    expect(catalog.activeGenre).toBeNull()
    expect(homeParams().genre).toBeNull()
  })

  it('sends the applied filters with the feed request', async () => {
    serveCatalog()

    const catalog = useCatalogStore()

    await catalog.applyFilters({ minRating: 8 })
    await catalog.applyFilters({ year: 2013 })

    expect(catalog.filters).toEqual({ year: 2013, genre: null, minRating: 8 })
    expect(catalog.hasFilters).toBe(true)
    expect(homeParams()).toMatchObject({ year: 2013, minRating: 8 })
  })

  it('keeps the genre but drops rating and year when the filters are reset', async () => {
    serveCatalog()

    const catalog = useCatalogStore()

    await catalog.selectGenre('drama')
    await catalog.applyFilters({ minRating: 9, year: 2020 })
    await catalog.resetFilters()

    expect(catalog.filters).toEqual({ year: null, genre: 'drama', minRating: null })
    expect(catalog.hasFilters).toBe(false)
  })
})
