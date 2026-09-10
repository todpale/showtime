import { mockEvent } from 'nitro/h3'
import handler from '../episodes.get'
import type { TvmazeEpisode } from '@/models'
import { it, vi, expect, describe, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({ fetchEpisodes: vi.fn() }))

vi.mock('~/utils/tvmaze', () => ({
  fetchShow: vi.fn(),
  fetchImages: vi.fn(),
  fetchSearch: vi.fn(),
  fetchEpisodes: mocks.fetchEpisodes,
  fetchShowPage: vi.fn()
}))

function makeEpisode(overrides: Partial<TvmazeEpisode> = {}): TvmazeEpisode {
  return {
    id: 10,
    name: 'Pilot',
    season: 1,
    type: 'regular',
    rating: { average: 7.8 },
    number: 1,
    airdate: '2013-06-24',
    runtime: 60,
    summary: null,
    airstamp: '2013-06-24T22:00:00+00:00',
    image: { medium: 'https://img/still.jpg', original: 'https://img/still-big.jpg' },
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
  mocks.fetchEpisodes.mockResolvedValue([])
})

describe('validation', () => {
  it('rejects a request without an id', async () => {
    await expect(handler(makeEvent('/api/v1/shows//episodes'))).rejects.toMatchObject({
      status: 400,
      message: 'Invalid show id'
    })
    expect(mocks.fetchEpisodes).not.toHaveBeenCalled()
  })

  it('rejects a non-numeric id', async () => {
    await expect(handler(makeEvent('/api/v1/shows/abc/episodes', { id: 'abc' }))).rejects.toMatchObject({ status: 400 })
    await expect(handler(makeEvent('/api/v1/shows/12abc/episodes', { id: '12abc' })))
      .rejects.toMatchObject({ status: 400 })
    expect(mocks.fetchEpisodes).not.toHaveBeenCalled()
  })
})

describe('grouping', () => {
  it('asks upstream for the episodes with the numeric id', async () => {
    await handler(makeEvent('/api/v1/shows/82/episodes', { id: '82' }))

    expect(mocks.fetchEpisodes).toHaveBeenCalledExactlyOnceWith(82)
  })

  it('returns an empty list when the show has no episodes', async () => {
    expect(await handler(makeEvent('/api/v1/shows/1/episodes', { id: '1' }))).toEqual([])
  })

  it('groups the episodes by season with the seasons ascending', async () => {
    mocks.fetchEpisodes.mockResolvedValue([
      makeEpisode({ id: 3, season: 3, number: 1 }),
      makeEpisode({ id: 1, season: 1, number: 1 }),
      makeEpisode({ id: 2, season: 2, number: 1 }),
      makeEpisode({ id: 4, season: 1, number: 2 })
    ])

    const groups = await handler(makeEvent('/api/v1/shows/1/episodes', { id: '1' }))

    expect(groups.map((group) => group.season)).toEqual([1, 2, 3])
    expect(groups[0]?.episodes.map((episode) => episode.id)).toEqual([1, 4])
    expect(groups[1]?.episodes.map((episode) => episode.id)).toEqual([2])
  })

  it('sorts the episodes of a season by their number', async () => {
    mocks.fetchEpisodes.mockResolvedValue([
      makeEpisode({ id: 3, number: 3 }),
      makeEpisode({ id: 1, number: 1 }),
      makeEpisode({ id: 2, number: 2 })
    ])

    const groups = await handler(makeEvent('/api/v1/shows/1/episodes', { id: '1' }))

    expect(groups[0]?.episodes.map((episode) => episode.number)).toEqual([1, 2, 3])
  })

  it('orders an episode without a number as if it came first', async () => {
    mocks.fetchEpisodes.mockResolvedValue([
      makeEpisode({ id: 2, number: 2 }),
      makeEpisode({ id: 9, number: null }),
      makeEpisode({ id: 1, number: 1 })
    ])

    const groups = await handler(makeEvent('/api/v1/shows/1/episodes', { id: '1' }))

    expect(groups[0]?.episodes.map((episode) => episode.id)).toEqual([9, 1, 2])
  })

  it('maps every episode onto the app episode shape', async () => {
    mocks.fetchEpisodes.mockResolvedValue([makeEpisode({ summary: '<p>Pilot &quot;one&quot;</p>' })])

    const groups = await handler(makeEvent('/api/v1/shows/1/episodes', { id: '1' }))

    expect(groups).toEqual([{
      season: 1,
      episodes: [{
        id: 10,
        name: 'Pilot',
        season: 1,
        number: 1,
        airdate: '2013-06-24',
        runtime: 60,
        summary: 'Pilot "one"',
        rating: 7.8,
        image: 'https://img/still.jpg'
      }]
    }])
  })

  it('lets an upstream failure bubble up', async () => {
    mocks.fetchEpisodes.mockRejectedValue(new Error('No such resource on TVmaze'))

    await expect(handler(makeEvent('/api/v1/shows/1/episodes', { id: '1' })))
      .rejects.toThrow('No such resource on TVmaze')
  })
})
