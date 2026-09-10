import handler from '../home.get'
import { mockEvent } from 'nitro/h3'
import { it, vi, expect, describe, beforeEach } from 'vitest'
import type { GenreIndex, GenreBucket, ShowSummary, TvmazeShowImage } from '@/models'

const mocks = vi.hoisted(() => ({
  readIndex: vi.fn(),
  readBucket: vi.fn(),
  fetchImages: vi.fn()
}))

vi.mock('~/utils/tvmaze', () => ({
  fetchShow: vi.fn(),
  fetchSearch: vi.fn(),
  fetchImages: mocks.fetchImages,
  fetchEpisodes: vi.fn(),
  fetchShowPage: vi.fn()
}))

vi.mock('~/utils/genres', async (importOriginal) => ({
  ...await importOriginal<Record<string, unknown>>(),
  readIndex: mocks.readIndex,
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

function makeIndex(overrides: Partial<GenreIndex> = {}): GenreIndex {
  return {
    fetchedAt: Date.now(),
    genres: [{ name: 'Drama', slug: 'drama', total: 1 }],
    spotlight: null,
    ...overrides
  }
}

function makeImage(overrides: Partial<TvmazeShowImage> = {}): TvmazeShowImage {
  return {
    id: 100,
    main: false,
    type: 'background',
    resolutions: { original: { url: 'https://img/bg.jpg', width: 1920, height: 1080 } },
    ...overrides
  }
}

function useBuckets(buckets: GenreBucket[]): void {
  mocks.readBucket.mockImplementation((slug: string) => {
    return Promise.resolve(buckets.find((bucket) => bucket.slug === slug) ?? null)
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.readIndex.mockResolvedValue(makeIndex())
  mocks.readBucket.mockResolvedValue(null)
  mocks.fetchImages.mockResolvedValue([])
})

describe('rows', () => {
  it('builds one row per indexed genre out of its bucket', async () => {
    mocks.readIndex.mockResolvedValue(makeIndex({
      genres: [
        { name: 'Drama', slug: 'drama', total: 2 },
        { name: 'Comedy', slug: 'comedy', total: 1 }
      ]
    }))
    useBuckets([
      makeBucket({ shows: [makeShow({ id: 1 }), makeShow({ id: 2 })], total: 2 }),
      makeBucket({ name: 'Comedy', slug: 'comedy', shows: [makeShow({ id: 3, genres: ['Comedy'] })] })
    ])

    const feed = await handler(mockEvent('/api/v1/home'))

    expect(feed.rows).toHaveLength(2)
    expect(feed.rows[0]).toEqual({
      name: 'Drama',
      slug: 'drama',
      total: 2,
      shows: [makeShow({ id: 1 }), makeShow({ id: 2 })]
    })
    expect(feed.rows[1]?.slug).toBe('comedy')
  })

  it('reports the matched count as the row total rather than the bucket total', async () => {
    useBuckets([makeBucket({ total: 500, shows: [makeShow({ id: 1 }), makeShow({ id: 2 })] })])

    const feed = await handler(mockEvent('/api/v1/home'))

    expect(feed.rows[0]?.total).toBe(2)
  })

  it('narrows the feed to a single row when a genre is requested', async () => {
    mocks.readIndex.mockResolvedValue(makeIndex({
      genres: [
        { name: 'Drama', slug: 'drama', total: 1 },
        { name: 'Comedy', slug: 'comedy', total: 1 }
      ]
    }))
    useBuckets([
      makeBucket(),
      makeBucket({ name: 'Comedy', slug: 'comedy', shows: [makeShow({ id: 3, genres: ['Comedy'] })] })
    ])

    const feed = await handler(mockEvent('/api/v1/home?genre=comedy'))

    expect(feed.rows).toHaveLength(1)
    expect(feed.rows[0]?.slug).toBe('comedy')
    expect(mocks.readBucket).toHaveBeenCalledExactlyOnceWith('comedy')
  })

  it('returns no rows when the requested genre is not in the index', async () => {
    const feed = await handler(mockEvent('/api/v1/home?genre=western'))

    expect(feed.rows).toEqual([])
    expect(mocks.readBucket).not.toHaveBeenCalled()
  })

  it('skips a genre whose bucket is missing', async () => {
    mocks.readIndex.mockResolvedValue(makeIndex({
      genres: [
        { name: 'Drama', slug: 'drama', total: 1 },
        { name: 'Comedy', slug: 'comedy', total: 1 }
      ]
    }))
    useBuckets([makeBucket({ name: 'Comedy', slug: 'comedy', shows: [makeShow({ genres: ['Comedy'] })] })])

    const feed = await handler(mockEvent('/api/v1/home'))

    expect(feed.rows).toHaveLength(1)
    expect(feed.rows[0]?.slug).toBe('comedy')
  })

  it('skips a genre whose shows are all filtered out', async () => {
    useBuckets([makeBucket({ shows: [makeShow({ year: 1999 })] })])

    const feed = await handler(mockEvent('/api/v1/home?year=2013'))

    expect(feed.rows).toEqual([])
  })
})

describe('filters', () => {
  it('keeps only the shows matching the year filter', async () => {
    useBuckets([makeBucket({ shows: [makeShow({ id: 1, year: 2013 }), makeShow({ id: 2, year: 1999 })] })])

    const feed = await handler(mockEvent('/api/v1/home?year=2013'))

    expect(feed.rows[0]?.shows.map((show) => show.id)).toEqual([1])
  })

  it('keeps only the shows at or above the minimum rating', async () => {
    useBuckets([makeBucket({
      shows: [makeShow({ id: 1, rating: 9 }), makeShow({ id: 2, rating: 5 }), makeShow({ id: 3, rating: null })]
    })])

    const feed = await handler(mockEvent('/api/v1/home?minRating=8'))

    expect(feed.rows[0]?.shows.map((show) => show.id)).toEqual([1])
  })
})

describe('paging', () => {
  it('puts twelve shows in a row by default', async () => {
    useBuckets([makeBucket({ shows: Array.from({ length: 30 }, (_, index) => makeShow({ id: index })) })])

    const feed = await handler(mockEvent('/api/v1/home'))

    expect(feed.rows[0]?.shows).toHaveLength(12)
  })

  it('clamps the per-row limit to at least one', async () => {
    useBuckets([makeBucket({ shows: Array.from({ length: 30 }, (_, index) => makeShow({ id: index })) })])

    expect((await handler(mockEvent('/api/v1/home?limit=0'))).rows[0]?.shows).toHaveLength(1)
    expect((await handler(mockEvent('/api/v1/home?limit=-5'))).rows[0]?.shows).toHaveLength(1)
  })

  it('clamps the per-row limit to at most forty', async () => {
    useBuckets([makeBucket({ shows: Array.from({ length: 60 }, (_, index) => makeShow({ id: index })) })])

    expect((await handler(mockEvent('/api/v1/home?limit=999'))).rows[0]?.shows).toHaveLength(40)
    expect((await handler(mockEvent('/api/v1/home?limit=40'))).rows[0]?.shows).toHaveLength(40)
  })

  it('takes eight rows by default', async () => {
    mocks.readIndex.mockResolvedValue(makeIndex({ genres: manyGenres(30) }))
    useBuckets(manyBuckets(30))

    const feed = await handler(mockEvent('/api/v1/home'))

    expect(feed.rows).toHaveLength(8)
  })

  it('clamps the row count to at least one', async () => {
    mocks.readIndex.mockResolvedValue(makeIndex({ genres: manyGenres(30) }))
    useBuckets(manyBuckets(30))

    expect((await handler(mockEvent('/api/v1/home?rows=0'))).rows).toHaveLength(1)
    expect((await handler(mockEvent('/api/v1/home?rows=-3'))).rows).toHaveLength(1)
  })

  it('clamps the row count to at most twenty', async () => {
    mocks.readIndex.mockResolvedValue(makeIndex({ genres: manyGenres(30) }))
    useBuckets(manyBuckets(30))

    expect((await handler(mockEvent('/api/v1/home?rows=99'))).rows).toHaveLength(20)
    expect((await handler(mockEvent('/api/v1/home?rows=20'))).rows).toHaveLength(20)
  })
})

describe('spotlight', () => {
  it('adds the picked backdrop to the indexed spotlight show', async () => {
    mocks.readIndex.mockResolvedValue(makeIndex({ spotlight: makeShow({ id: 42, name: 'Spotlight' }) }))
    mocks.fetchImages.mockResolvedValue([
      makeImage({ id: 1, type: 'poster' }),
      makeImage({ id: 2, main: true, resolutions: { original: { url: 'https://img/main.jpg', width: 1, height: 1 } } })
    ])

    const feed = await handler(mockEvent('/api/v1/home'))

    expect(mocks.fetchImages).toHaveBeenCalledExactlyOnceWith(42)
    expect(feed.spotlight).toEqual(makeShow({ id: 42, name: 'Spotlight', backdrop: 'https://img/main.jpg' }))
  })

  it('leaves the backdrop null when the show has no background image', async () => {
    mocks.readIndex.mockResolvedValue(makeIndex({ spotlight: makeShow({ id: 42 }) }))
    mocks.fetchImages.mockResolvedValue([makeImage({ type: 'poster' })])

    const feed = await handler(mockEvent('/api/v1/home'))

    expect(feed.spotlight?.backdrop).toBeNull()
  })

  it('returns a null spotlight without asking for images when the index has none', async () => {
    const feed = await handler(mockEvent('/api/v1/home'))

    expect(feed.spotlight).toBeNull()
    expect(mocks.fetchImages).not.toHaveBeenCalled()
  })
})

function manyGenres(count: number): GenreIndex['genres'] {
  return Array.from({ length: count }, (_, index) => ({ name: `Genre ${index}`, slug: `genre-${index}`, total: 1 }))
}

function manyBuckets(count: number): GenreBucket[] {
  return Array.from({ length: count }, (_, index) => makeBucket({
    name: `Genre ${index}`,
    slug: `genre-${index}`,
    shows: [makeShow({ id: index })]
  }))
}
