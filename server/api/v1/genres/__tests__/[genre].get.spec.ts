import { mockEvent } from 'nitro/h3'
import handler from '../[genre].get'
import type { GenreBucket, ShowSummary } from '@/models'
import { it, vi, expect, describe, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({ readBucket: vi.fn() }))

vi.mock('~/utils/tvmaze', () => ({
  fetchShow: vi.fn(),
  fetchImages: vi.fn(),
  fetchSearch: vi.fn(),
  fetchEpisodes: vi.fn(),
  fetchShowPage: vi.fn()
}))

vi.mock('~/utils/genres', async (importOriginal) => ({
  ...await importOriginal<Record<string, unknown>>(),
  readIndex: vi.fn(),
  readBucket: mocks.readBucket
}))

function makeShow(overrides: Partial<ShowSummary> = {}): ShowSummary {
  return {
    id: 1,
    name: 'Show',
    genres: ['Drama'],
    type: 'Scripted',
    year: 2013,
    rating: 7,
    poster: null,
    network: null,
    backdrop: null,
    posterLarge: null,
    ...overrides
  }
}

function makeBucket(overrides: Partial<GenreBucket> = {}): GenreBucket {
  return {
    name: 'Drama',
    slug: 'drama',
    total: 1,
    fetchedAt: Date.now(),
    shows: [makeShow()],
    ...overrides
  }
}

function makeEvent(url: string, params?: Record<string, string>): ReturnType<typeof mockEvent> {
  const event = mockEvent(url)

  if (params) {
    event.context.params = params
  }

  return event
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.readBucket.mockResolvedValue(makeBucket())
})

describe('validation', () => {
  it('rejects a request without a genre param', async () => {
    await expect(handler(makeEvent('/api/v1/genres/'))).rejects.toMatchObject({
      status: 400,
      message: 'Missing genre'
    })
    expect(mocks.readBucket).not.toHaveBeenCalled()
  })

  it('rejects a request whose params object is empty', async () => {
    await expect(handler(makeEvent('/api/v1/genres/', {}))).rejects.toMatchObject({ status: 400 })
  })

  it('reports an unknown genre by name', async () => {
    mocks.readBucket.mockResolvedValue(null)

    await expect(handler(makeEvent('/api/v1/genres/western', { genre: 'western' }))).rejects.toMatchObject({
      status: 404,
      message: 'Unknown genre "western"'
    })
  })
})

describe('lookup', () => {
  it('slugifies the param before reading the bucket', async () => {
    await handler(makeEvent('/api/v1/genres/Science-Fiction', { genre: 'Science-Fiction' }))

    expect(mocks.readBucket).toHaveBeenCalledExactlyOnceWith('science-fiction')
  })

  it('slugifies a param that carries spaces and punctuation', async () => {
    await handler(makeEvent('/api/v1/genres/action-adventure', { genre: 'Action & Adventure' }))

    expect(mocks.readBucket).toHaveBeenCalledExactlyOnceWith('action-adventure')
  })
})

describe('page shape', () => {
  it('keeps the bucket name, slug and total while reporting the matched count separately', async () => {
    mocks.readBucket.mockResolvedValue(makeBucket({
      total: 500,
      shows: [makeShow({ id: 1, year: 2013 }), makeShow({ id: 2, year: 2013 }), makeShow({ id: 3, year: 1999 })]
    }))

    const page = await handler(makeEvent('/api/v1/genres/drama?year=2013', { genre: 'drama' }))

    expect(page.name).toBe('Drama')
    expect(page.slug).toBe('drama')
    expect(page.total).toBe(500)
    expect(page.matched).toBe(2)
    expect(page.shows.map((show) => show.id)).toEqual([1, 2])
  })

  it('counts every show as matched when no filter is given', async () => {
    mocks.readBucket.mockResolvedValue(makeBucket({
      total: 500,
      shows: [makeShow({ id: 1 }), makeShow({ id: 2 })]
    }))

    const page = await handler(makeEvent('/api/v1/genres/drama', { genre: 'drama' }))

    expect(page.matched).toBe(2)
  })

  it('offers the years of the bucket newest first', async () => {
    mocks.readBucket.mockResolvedValue(makeBucket({
      shows: [makeShow({ id: 1, year: 2013 }), makeShow({ id: 2, year: 2018 }), makeShow({ id: 3, year: 2013 })]
    }))

    const page = await handler(makeEvent('/api/v1/genres/drama', { genre: 'drama' }))

    expect(page.years).toEqual([2018, 2013])
  })

  it('still offers the other years while one of them is filtered on', async () => {
    mocks.readBucket.mockResolvedValue(makeBucket({
      shows: [makeShow({ id: 1, year: 2013 }), makeShow({ id: 2, year: 2018 })]
    }))

    const page = await handler(makeEvent('/api/v1/genres/drama?year=2018', { genre: 'drama' }))

    expect(page.years).toEqual([2018, 2013])
    expect(page.shows.map((show) => show.id)).toEqual([2])
  })

  it('offers only years that survive the minimum rating', async () => {
    mocks.readBucket.mockResolvedValue(makeBucket({
      shows: [makeShow({ id: 1, year: 2013, rating: 9 }), makeShow({ id: 2, year: 2018, rating: 4 })]
    }))

    const page = await handler(makeEvent('/api/v1/genres/drama?minRating=8', { genre: 'drama' }))

    expect(page.years).toEqual([2013])
  })

  it('offers no years for a bucket without dated shows', async () => {
    mocks.readBucket.mockResolvedValue(makeBucket({ shows: [makeShow({ id: 1, year: null })] }))

    const page = await handler(makeEvent('/api/v1/genres/drama', { genre: 'drama' }))

    expect(page.years).toEqual([])
  })

  it('offers the same years on every page of the genre', async () => {
    mocks.readBucket.mockResolvedValue(makeBucket({ shows: manyShows(50) }))

    const first = await handler(makeEvent('/api/v1/genres/drama?limit=24', { genre: 'drama' }))
    const second = await handler(makeEvent('/api/v1/genres/drama?limit=24&offset=24', { genre: 'drama' }))

    expect(second.years).toEqual(first.years)
  })

  it('drops the shows below the minimum rating', async () => {
    mocks.readBucket.mockResolvedValue(makeBucket({
      shows: [makeShow({ id: 1, rating: 9 }), makeShow({ id: 2, rating: 4 })]
    }))

    const page = await handler(makeEvent('/api/v1/genres/drama?minRating=8', { genre: 'drama' }))

    expect(page.shows.map((show) => show.id)).toEqual([1])
  })
})

describe('sorting', () => {
  it('sorts by rating descending by default', async () => {
    mocks.readBucket.mockResolvedValue(makeBucket({
      shows: [makeShow({ id: 1, rating: 5 }), makeShow({ id: 2, rating: 9 }), makeShow({ id: 3, rating: null })]
    }))

    const page = await handler(makeEvent('/api/v1/genres/drama', { genre: 'drama' }))

    expect(page.shows.map((show) => show.id)).toEqual([2, 1, 3])
  })

  it('sorts by name when asked to', async () => {
    mocks.readBucket.mockResolvedValue(makeBucket({
      shows: [makeShow({ id: 1, name: 'Zulu', rating: 9 }), makeShow({ id: 2, name: 'Alpha', rating: 5 })]
    }))

    const page = await handler(makeEvent('/api/v1/genres/drama?sort=name', { genre: 'drama' }))

    expect(page.shows.map((show) => show.name)).toEqual(['Alpha', 'Zulu'])
  })
})

describe('paging', () => {
  it('returns twenty four shows by default', async () => {
    mocks.readBucket.mockResolvedValue(makeBucket({ shows: manyShows(50) }))

    const page = await handler(makeEvent('/api/v1/genres/drama', { genre: 'drama' }))

    expect(page.shows).toHaveLength(24)
    expect(page.matched).toBe(50)
  })

  it('takes a window out of the sorted list', async () => {
    mocks.readBucket.mockResolvedValue(makeBucket({ shows: manyShows(5) }))

    const page = await handler(makeEvent('/api/v1/genres/drama?offset=1&limit=2&sort=name', { genre: 'drama' }))

    expect(page.shows.map((show) => show.id)).toEqual([1, 2])
  })

  it('clamps a negative offset to the start of the list', async () => {
    mocks.readBucket.mockResolvedValue(makeBucket({ shows: manyShows(5) }))

    const page = await handler(makeEvent('/api/v1/genres/drama?offset=-5&limit=2&sort=name', { genre: 'drama' }))

    expect(page.shows.map((show) => show.id)).toEqual([0, 1])
  })

  it('returns nothing when the offset runs past the matched shows', async () => {
    mocks.readBucket.mockResolvedValue(makeBucket({ shows: manyShows(5) }))

    const page = await handler(makeEvent('/api/v1/genres/drama?offset=99', { genre: 'drama' }))

    expect(page.shows).toEqual([])
    expect(page.matched).toBe(5)
  })

  it('clamps the limit to at least one', async () => {
    mocks.readBucket.mockResolvedValue(makeBucket({ shows: manyShows(5) }))

    const zero = await handler(makeEvent('/api/v1/genres/drama?limit=0', { genre: 'drama' }))
    const negative = await handler(makeEvent('/api/v1/genres/drama?limit=-4', { genre: 'drama' }))

    expect(zero.shows).toHaveLength(1)
    expect(negative.shows).toHaveLength(1)
  })

  it('clamps the limit to at most one hundred', async () => {
    mocks.readBucket.mockResolvedValue(makeBucket({ shows: manyShows(150) }))

    const capped = await handler(makeEvent('/api/v1/genres/drama?limit=999', { genre: 'drama' }))
    const exact = await handler(makeEvent('/api/v1/genres/drama?limit=100', { genre: 'drama' }))

    expect(capped.shows).toHaveLength(100)
    expect(exact.shows).toHaveLength(100)
  })
})

function manyShows(count: number): ShowSummary[] {
  return Array.from({ length: count }, (_, index) => makeShow({
    id: index,
    name: `Show ${String(index).padStart(3, '0')}`,
    rating: count - index
  }))
}
