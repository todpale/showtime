import { apiGet } from '@/utils/api'
import type { GenrePage } from '@/models'
import { useGenreStore } from '@/stores/genre'
import { makeShow } from '@/__tests__/fixtures'
import { createPinia, setActivePinia } from 'pinia'
import { vi, it, expect, describe, beforeEach } from 'vitest'

vi.mock('@/utils/api', () => ({ apiGet: vi.fn(), toQuery: vi.fn(() => '') }))

const apiGetMock = vi.mocked(apiGet)

function makePage(overrides: Partial<GenrePage> = {}): GenrePage {
  return {
    name: 'Drama',
    slug: 'drama',
    total: 120,
    matched: 120,
    years: [2013, 2011, 2009],
    shows: [makeShow({ id: 1 }), makeShow({ id: 2 })],
    ...overrides
  }
}

function lastParams(): Record<string, unknown> {
  const calls = apiGetMock.mock.calls

  return (calls[calls.length - 1]?.[1] ?? {}) as Record<string, unknown>
}

function defer<T>(): { promise: Promise<T>, resolve: (value: T) => void } {
  let release: (value: T) => void = () => undefined

  const promise = new Promise<T>((settle) => {
    release = settle
  })

  return { promise, resolve: (value: T) => release(value) }
}

describe('genre store', () => {
  beforeEach(() => {
    apiGetMock.mockReset()
    setActivePinia(createPinia())
  })

  it('starts idle with an empty bucket', () => {
    const genre = useGenreStore()

    expect(genre.status).toBe('idle')
    expect(genre.shows).toEqual([])
    expect(genre.canLoadMore).toBe(false)
    expect(genre.hasFilters).toBe(false)
  })

  it('opens a genre and loads its first page', async () => {
    apiGetMock.mockResolvedValue(makePage())

    const genre = useGenreStore()
    const pending = genre.open('drama')

    expect(genre.status).toBe('loading')

    await pending

    expect(genre.status).toBe('ready')
    expect(genre.slug).toBe('drama')
    expect(genre.name).toBe('Drama')
    expect(genre.total).toBe(120)
    expect(genre.matched).toBe(120)
    expect(genre.shows.map((show) => show.id)).toEqual([1, 2])
    expect(apiGetMock).toHaveBeenCalledWith('/genres/drama', expect.objectContaining({ offset: 0, sort: 'rating' }))
  })

  it('takes the year chips from the page it loaded', async () => {
    apiGetMock.mockResolvedValue(makePage({ years: [2018, 2015, 2013] }))

    const genre = useGenreStore()

    await genre.open('drama')

    expect(genre.years).toEqual([2018, 2015, 2013])
  })

  it('refreshes the year chips on every reload', async () => {
    apiGetMock.mockResolvedValueOnce(makePage({ years: [2018, 2015, 2013] }))
    apiGetMock.mockResolvedValueOnce(makePage({ years: [2015] }))

    const genre = useGenreStore()

    await genre.open('drama')
    await genre.setFilters({ minRating: 9 })

    expect(genre.years).toEqual([2015])
  })

  it('starts a new genre without the year chips of the old one', async () => {
    apiGetMock.mockResolvedValueOnce(makePage({ years: [2018, 2015] }))
    apiGetMock.mockResolvedValueOnce(makePage({ name: 'Comedy', slug: 'comedy', years: [2011] }))

    const genre = useGenreStore()

    await genre.open('drama')

    const pending = genre.open('comedy')

    expect(genre.years).toEqual([])

    await pending

    expect(genre.years).toEqual([2011])
  })

  it('keeps the year chips when a page fails to load', async () => {
    apiGetMock.mockResolvedValueOnce(makePage({ years: [2018, 2015] }))
    apiGetMock.mockRejectedValueOnce(new Error('Boom'))

    const genre = useGenreStore()

    await genre.open('drama')
    await genre.setSort('name')

    expect(genre.status).toBe('error')
    expect(genre.years).toEqual([2018, 2015])
  })

  it('keeps the year chips while paging through the genre', async () => {
    apiGetMock.mockResolvedValueOnce(makePage({ matched: 4, years: [2018, 2015] }))
    apiGetMock.mockResolvedValueOnce(makePage({
      matched: 4,
      years: [],
      shows: [makeShow({ id: 3 }), makeShow({ id: 4 })]
    }))

    const genre = useGenreStore()

    await genre.open('drama')
    await genre.loadMore()

    expect(genre.years).toEqual([2018, 2015])
  })

  it('does not refetch a genre that is already open', async () => {
    apiGetMock.mockResolvedValue(makePage())

    const genre = useGenreStore()

    await genre.open('drama')
    await genre.open('drama')

    expect(apiGetMock).toHaveBeenCalledTimes(1)
  })

  it('resets sort and filters when a different genre is opened', async () => {
    apiGetMock.mockResolvedValue(makePage())

    const genre = useGenreStore()

    await genre.open('drama')
    await genre.setSort('name')
    await genre.setFilters({ minRating: 8 })
    await genre.open('comedy')

    expect(genre.sort).toBe('rating')
    expect(genre.filters).toEqual({ year: null, genre: null, minRating: null })
    expect(genre.slug).toBe('comedy')
  })

  it('reports an error when the page cannot be loaded', async () => {
    apiGetMock.mockRejectedValue(new Error('No such genre'))

    const genre = useGenreStore()

    await genre.open('nope')

    expect(genre.status).toBe('error')
    expect(genre.error).toBe('No such genre')
    expect(genre.shows).toEqual([])
  })

  it('appends the next page of shows', async () => {
    apiGetMock.mockResolvedValueOnce(makePage({ matched: 4 }))
    apiGetMock.mockResolvedValueOnce(makePage({
      matched: 4,
      shows: [makeShow({ id: 3 }), makeShow({ id: 4 })]
    }))

    const genre = useGenreStore()

    await genre.open('drama')

    expect(genre.canLoadMore).toBe(true)

    await genre.loadMore()

    expect(genre.shows.map((show) => show.id)).toEqual([1, 2, 3, 4])
    expect(genre.canLoadMore).toBe(false)
  })

  it('asks for the next page starting after the shows it already has', async () => {
    apiGetMock.mockResolvedValueOnce(makePage({ matched: 4 }))
    apiGetMock.mockResolvedValueOnce(makePage({ matched: 4, shows: [makeShow({ id: 3 })] }))

    const genre = useGenreStore()

    await genre.open('drama')
    await genre.loadMore()

    expect(lastParams().offset).toBe(2)
  })

  it('never shows the same show twice when pages overlap', async () => {
    apiGetMock.mockResolvedValueOnce(makePage({ matched: 3 }))
    apiGetMock.mockResolvedValueOnce(makePage({
      matched: 3,
      shows: [makeShow({ id: 2 }), makeShow({ id: 3 })]
    }))

    const genre = useGenreStore()

    await genre.open('drama')
    await genre.loadMore()

    expect(genre.shows.map((show) => show.id)).toEqual([1, 2, 3])
  })

  it('does not load more once every match is on screen', async () => {
    apiGetMock.mockResolvedValue(makePage({ matched: 2 }))

    const genre = useGenreStore()

    await genre.open('drama')
    await genre.loadMore()

    expect(apiGetMock).toHaveBeenCalledTimes(1)
  })

  it('reloads from the top when the sort changes', async () => {
    apiGetMock.mockResolvedValue(makePage())

    const genre = useGenreStore()

    await genre.open('drama')
    await genre.setSort('year')

    expect(genre.sort).toBe('year')
    expect(lastParams()).toMatchObject({ sort: 'year', offset: 0 })
  })

  it('reloads with the filters applied', async () => {
    apiGetMock.mockResolvedValue(makePage())

    const genre = useGenreStore()

    await genre.open('drama')
    await genre.setFilters({ minRating: 8, year: 2013 })

    expect(genre.hasFilters).toBe(true)
    expect(lastParams()).toMatchObject({ minRating: 8, year: 2013, offset: 0 })
  })

  it('clears the filters and reloads', async () => {
    apiGetMock.mockResolvedValue(makePage())

    const genre = useGenreStore()

    await genre.open('drama')
    await genre.setFilters({ minRating: 8 })
    await genre.resetFilters()

    expect(genre.hasFilters).toBe(false)
    expect(lastParams().minRating).toBeNull()
  })
})

describe('genre store load more failures', () => {
  beforeEach(() => {
    apiGetMock.mockReset()
    setActivePinia(createPinia())
  })

  async function openPaged(matched = 4): Promise<ReturnType<typeof useGenreStore>> {
    apiGetMock.mockResolvedValueOnce(makePage({ matched }))

    const genre = useGenreStore()

    await genre.open('drama')

    return genre
  }

  it('starts with an idle load-more slot', async () => {
    const genre = await openPaged()

    expect(genre.moreStatus).toBe('idle')
    expect(genre.moreError).toBeNull()
  })

  it('marks the load-more slot as loading while the next page is in flight', async () => {
    const gate = defer<GenrePage>()
    const genre = await openPaged()

    apiGetMock.mockReturnValueOnce(gate.promise)

    const pending = genre.loadMore()

    expect(genre.moreStatus).toBe('loading')
    expect(genre.moreError).toBeNull()

    gate.resolve(makePage({ matched: 4, shows: [makeShow({ id: 3 }), makeShow({ id: 4 })] }))
    await pending

    expect(genre.moreStatus).toBe('ready')
  })

  it('keeps every loaded show when the next page fails', async () => {
    const genre = await openPaged()
    const before = genre.shows.map((show) => ({ ...show }))

    apiGetMock.mockRejectedValueOnce(new Error('Next page exploded'))

    await genre.loadMore()

    expect(genre.moreStatus).toBe('error')
    expect(genre.moreError).toBe('Next page exploded')
    expect(genre.shows).toHaveLength(2)
    expect(genre.shows.map((show) => show.id)).toEqual([1, 2])
    expect(genre.shows).toEqual(before)
  })

  it('leaves the page itself ready when only the next page fails', async () => {
    const genre = await openPaged()

    apiGetMock.mockRejectedValueOnce(new Error('Next page exploded'))

    await genre.loadMore()

    expect(genre.status).toBe('ready')
    expect(genre.error).toBeNull()
    expect(genre.canLoadMore).toBe(true)
  })

  it('keeps the genre metadata untouched when the next page fails', async () => {
    const genre = await openPaged()

    apiGetMock.mockRejectedValueOnce(new Error('Next page exploded'))

    await genre.loadMore()

    expect(genre.name).toBe('Drama')
    expect(genre.matched).toBe(4)
    expect(genre.total).toBe(120)
    expect(genre.years).toEqual([2013, 2011, 2009])
  })

  it('reports a rejection that is not an Error as text', async () => {
    const genre = await openPaged()

    apiGetMock.mockRejectedValueOnce('offline')

    await genre.loadMore()

    expect(genre.moreError).toBe('offline')
    expect(genre.moreStatus).toBe('error')
  })

  it('marks the slot ready and appends only unseen shows on success', async () => {
    const genre = await openPaged(3)

    apiGetMock.mockResolvedValueOnce(makePage({
      matched: 3,
      shows: [makeShow({ id: 2 }), makeShow({ id: 3 })]
    }))

    await genre.loadMore()

    expect(genre.moreStatus).toBe('ready')
    expect(genre.moreError).toBeNull()
    expect(genre.shows.map((show) => show.id)).toEqual([1, 2, 3])
  })

  it('asks for the next page only once while a request is still in flight', async () => {
    const gate = defer<GenrePage>()
    const genre = await openPaged()

    apiGetMock.mockReturnValueOnce(gate.promise)

    const first = genre.loadMore()
    const second = genre.loadMore()

    expect(apiGetMock).toHaveBeenCalledTimes(2)

    gate.resolve(makePage({ matched: 4, shows: [makeShow({ id: 3 }), makeShow({ id: 4 })] }))
    await Promise.all([first, second])

    expect(apiGetMock).toHaveBeenCalledTimes(2)
    expect(genre.shows.map((show) => show.id)).toEqual([1, 2, 3, 4])
  })

  it('does not start a next page while the first page is still loading', async () => {
    const gate = defer<GenrePage>()

    apiGetMock.mockReturnValueOnce(gate.promise)

    const genre = useGenreStore()
    const opening = genre.open('drama')

    genre.matched = 4
    genre.shows = [makeShow({ id: 1 })]

    await genre.loadMore()

    expect(apiGetMock).toHaveBeenCalledTimes(1)
    expect(genre.moreStatus).toBe('idle')

    gate.resolve(makePage({ matched: 4 }))
    await opening
  })

  it('recovers when the next page is retried', async () => {
    const genre = await openPaged()

    apiGetMock.mockRejectedValueOnce(new Error('Next page exploded'))
    await genre.loadMore()

    expect(genre.moreStatus).toBe('error')

    apiGetMock.mockResolvedValueOnce(makePage({
      matched: 4,
      shows: [makeShow({ id: 3 }), makeShow({ id: 4 })]
    }))
    await genre.loadMore()

    expect(genre.moreStatus).toBe('ready')
    expect(genre.moreError).toBeNull()
    expect(genre.shows.map((show) => show.id)).toEqual([1, 2, 3, 4])
  })

  it('clears a stale next-page failure on reload', async () => {
    const genre = await openPaged()

    apiGetMock.mockRejectedValueOnce(new Error('Next page exploded'))
    await genre.loadMore()

    expect(genre.moreError).toBe('Next page exploded')

    apiGetMock.mockResolvedValueOnce(makePage({ matched: 4 }))
    await genre.reload()

    expect(genre.moreStatus).toBe('idle')
    expect(genre.moreError).toBeNull()
  })

  it('clears a stale next-page failure when the sort changes', async () => {
    const genre = await openPaged()

    apiGetMock.mockRejectedValueOnce(new Error('Next page exploded'))
    await genre.loadMore()

    apiGetMock.mockResolvedValueOnce(makePage({ matched: 4 }))
    await genre.setSort('name')

    expect(genre.moreStatus).toBe('idle')
    expect(genre.moreError).toBeNull()
  })

  it('clears a stale next-page failure when another genre is opened', async () => {
    const genre = await openPaged()

    apiGetMock.mockRejectedValueOnce(new Error('Next page exploded'))
    await genre.loadMore()

    expect(genre.moreError).toBe('Next page exploded')

    apiGetMock.mockResolvedValueOnce(makePage({ name: 'Comedy', slug: 'comedy' }))
    await genre.open('comedy')

    expect(genre.moreStatus).toBe('idle')
    expect(genre.moreError).toBeNull()
  })

  it('drops the next-page failure before the new genre has answered', async () => {
    const gate = defer<GenrePage>()
    const genre = await openPaged()

    apiGetMock.mockRejectedValueOnce(new Error('Next page exploded'))
    await genre.loadMore()

    apiGetMock.mockReturnValueOnce(gate.promise)

    const opening = genre.open('comedy')

    expect(genre.moreStatus).toBe('idle')
    expect(genre.moreError).toBeNull()

    gate.resolve(makePage({ name: 'Comedy', slug: 'comedy' }))
    await opening
  })

  it('leaves the slot idle when there is nothing left to load', async () => {
    apiGetMock.mockResolvedValue(makePage({ matched: 2 }))

    const genre = useGenreStore()

    await genre.open('drama')
    await genre.loadMore()

    expect(genre.moreStatus).toBe('idle')
    expect(genre.moreError).toBeNull()
    expect(apiGetMock).toHaveBeenCalledTimes(1)
  })
})
