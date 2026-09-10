import handler from '../search.get'
import { mockEvent } from 'nitro/h3'
import type { TvmazeShow, TvmazeSearchHit } from '@/models'
import { it, vi, expect, describe, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({ fetchSearch: vi.fn() }))

vi.mock('~/utils/tvmaze', () => ({
  fetchShow: vi.fn(),
  fetchImages: vi.fn(),
  fetchSearch: mocks.fetchSearch,
  fetchEpisodes: vi.fn(),
  fetchShowPage: vi.fn()
}))

function makeShow(overrides: Partial<TvmazeShow> = {}): TvmazeShow {
  return {
    id: 1,
    name: 'Under the Dome',
    genres: ['Drama', 'Science-Fiction'],
    type: 'Scripted',
    ended: null,
    rating: { average: 6.5 },
    status: 'Ended',
    runtime: 60,
    summary: null,
    language: 'English',
    premiered: '2013-06-24',
    image: { medium: 'https://img/medium.jpg', original: 'https://img/original.jpg' },
    officialSite: null,
    averageRuntime: 45,
    network: { id: 2, name: 'CBS', country: null },
    webChannel: null,
    ...overrides
  }
}

function makeHit(score: number, overrides: Partial<TvmazeShow> = {}): TvmazeSearchHit {
  return { score, show: makeShow(overrides) }
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.fetchSearch.mockResolvedValue([])
})

describe('term handling', () => {
  it('returns an empty response without calling upstream when there is no term', async () => {
    const response = await handler(mockEvent('/api/v1/search'))

    expect(response).toEqual({ query: '', total: 0, results: [] })
    expect(mocks.fetchSearch).not.toHaveBeenCalled()
  })

  it('returns an empty response for a blank or whitespace-only term', async () => {
    expect(await handler(mockEvent('/api/v1/search?q='))).toEqual({ query: '', total: 0, results: [] })
    expect(await handler(mockEvent('/api/v1/search?q=%20%20%20'))).toEqual({ query: '', total: 0, results: [] })
    expect(mocks.fetchSearch).not.toHaveBeenCalled()
  })

  it('trims the term before the upstream call and echoes the trimmed term back', async () => {
    const response = await handler(mockEvent('/api/v1/search?q=%20%20dome%20%20'))

    expect(mocks.fetchSearch).toHaveBeenCalledExactlyOnceWith('dome')
    expect(response.query).toBe('dome')
  })
})

describe('mapping', () => {
  it('maps a hit onto a search result with score, plain summary and no season count', async () => {
    mocks.fetchSearch.mockResolvedValue([makeHit(0.94, { summary: '<p>A dome &amp; a town</p>' })])

    const response = await handler(mockEvent('/api/v1/search?q=dome'))

    expect(response.results).toEqual([{
      id: 1,
      name: 'Under the Dome',
      type: 'Scripted',
      genres: ['Drama', 'Science-Fiction'],
      year: 2013,
      score: 0.94,
      rating: 6.5,
      network: 'CBS',
      poster: 'https://img/medium.jpg',
      backdrop: null,
      posterLarge: 'https://img/original.jpg',
      summary: 'A dome & a town',
      seasonCount: null
    }])
  })

  it('reports the number of returned results as the total', async () => {
    mocks.fetchSearch.mockResolvedValue([makeHit(0.9, { id: 1 }), makeHit(0.8, { id: 2 })])

    const response = await handler(mockEvent('/api/v1/search?q=dome'))

    expect(response.total).toBe(2)
  })
})

describe('filters', () => {
  it('drops the hits below the minimum rating and counts only what is left', async () => {
    mocks.fetchSearch.mockResolvedValue([
      makeHit(0.9, { id: 1, rating: { average: 9 } }),
      makeHit(0.8, { id: 2, rating: { average: 4 } })
    ])

    const response = await handler(mockEvent('/api/v1/search?q=dome&minRating=8'))

    expect(response.results.map((result) => result.id)).toEqual([1])
    expect(response.total).toBe(1)
  })

  it('drops the hits from another year', async () => {
    mocks.fetchSearch.mockResolvedValue([
      makeHit(0.9, { id: 1, premiered: '2013-06-24' }),
      makeHit(0.8, { id: 2, premiered: '1999-01-01' })
    ])

    const response = await handler(mockEvent('/api/v1/search?q=dome&year=1999'))

    expect(response.results.map((result) => result.id)).toEqual([2])
  })

  it('drops the hits outside the requested genre', async () => {
    mocks.fetchSearch.mockResolvedValue([
      makeHit(0.9, { id: 1, genres: ['Drama'] }),
      makeHit(0.8, { id: 2, genres: ['Science-Fiction'] })
    ])

    const response = await handler(mockEvent('/api/v1/search?q=dome&genre=science-fiction'))

    expect(response.results.map((result) => result.id)).toEqual([2])
  })
})

describe('sorting', () => {
  it('keeps the upstream relevance order by default', async () => {
    mocks.fetchSearch.mockResolvedValue([
      makeHit(0.9, { id: 1, rating: { average: 5 } }),
      makeHit(0.8, { id: 2, rating: { average: 9 } })
    ])

    const response = await handler(mockEvent('/api/v1/search?q=dome'))

    expect(response.results.map((result) => result.id)).toEqual([1, 2])
  })

  it('keeps the upstream relevance order for an unknown sort key', async () => {
    mocks.fetchSearch.mockResolvedValue([
      makeHit(0.9, { id: 1, rating: { average: 5 } }),
      makeHit(0.8, { id: 2, rating: { average: 9 } })
    ])

    const response = await handler(mockEvent('/api/v1/search?q=dome&sort=popularity'))

    expect(response.results.map((result) => result.id)).toEqual([1, 2])
  })

  it('reorders the results by rating when asked to', async () => {
    mocks.fetchSearch.mockResolvedValue([
      makeHit(0.9, { id: 1, rating: { average: 5 } }),
      makeHit(0.8, { id: 2, rating: { average: 9 } })
    ])

    const response = await handler(mockEvent('/api/v1/search?q=dome&sort=rating'))

    expect(response.results.map((result) => result.id)).toEqual([2, 1])
  })

  it('reorders the results by name when asked to', async () => {
    mocks.fetchSearch.mockResolvedValue([
      makeHit(0.9, { id: 1, name: 'Zulu' }),
      makeHit(0.8, { id: 2, name: 'Alpha' })
    ])

    const response = await handler(mockEvent('/api/v1/search?q=dome&sort=name'))

    expect(response.results.map((result) => result.name)).toEqual(['Alpha', 'Zulu'])
  })
})
