import handler from '../index.get'
import { mockEvent } from 'nitro/h3'
import type { GenreIndex } from '@/models'
import { it, vi, expect, describe, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({ readIndex: vi.fn() }))

vi.mock('~/utils/tvmaze', () => ({
  fetchShow: vi.fn(),
  fetchImages: vi.fn(),
  fetchSearch: vi.fn(),
  fetchEpisodes: vi.fn(),
  fetchShowPage: vi.fn()
}))

vi.mock('~/utils/genres', async (importOriginal) => ({
  ...await importOriginal<Record<string, unknown>>(),
  readIndex: mocks.readIndex,
  readBucket: vi.fn()
}))

function makeIndex(overrides: Partial<GenreIndex> = {}): GenreIndex {
  return {
    fetchedAt: 1700000000000,
    genres: [{ name: 'Drama', slug: 'drama', total: 120 }],
    spotlight: null,
    ...overrides
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.readIndex.mockResolvedValue(makeIndex())
})

describe('genres index', () => {
  it('returns the genre list of the index in its stored order', async () => {
    mocks.readIndex.mockResolvedValue(makeIndex({
      genres: [
        { name: 'Drama', slug: 'drama', total: 120 },
        { name: 'Comedy', slug: 'comedy', total: 90 },
        { name: 'Science-Fiction', slug: 'science-fiction', total: 40 }
      ]
    }))

    const genres = await handler(mockEvent('/api/v1/genres'))

    expect(genres).toEqual([
      { name: 'Drama', slug: 'drama', total: 120 },
      { name: 'Comedy', slug: 'comedy', total: 90 },
      { name: 'Science-Fiction', slug: 'science-fiction', total: 40 }
    ])
  })

  it('returns an empty list when the index holds no genres', async () => {
    mocks.readIndex.mockResolvedValue(makeIndex({ genres: [] }))

    expect(await handler(mockEvent('/api/v1/genres'))).toEqual([])
  })

  it('does not expose the rest of the index', async () => {
    const genres = await handler(mockEvent('/api/v1/genres'))

    expect(Array.isArray(genres)).toBe(true)
    expect(mocks.readIndex).toHaveBeenCalledOnce()
  })
})
