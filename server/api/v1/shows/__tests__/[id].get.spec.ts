import handler from '../[id].get'
import { mockEvent } from 'nitro/h3'
import type { TvmazeShow, TvmazeShowImage } from '@/models'
import { it, vi, expect, describe, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({ fetchShow: vi.fn(), fetchImages: vi.fn() }))

vi.mock('~/utils/tvmaze', () => ({
  fetchShow: mocks.fetchShow,
  fetchImages: mocks.fetchImages,
  fetchSearch: vi.fn(),
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

function makeImage(overrides: Partial<TvmazeShowImage> = {}): TvmazeShowImage {
  return {
    id: 100,
    main: false,
    type: 'background',
    resolutions: { original: { url: 'https://img/bg.jpg', width: 1920, height: 1080 } },
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
  mocks.fetchShow.mockResolvedValue(makeShow())
  mocks.fetchImages.mockResolvedValue([])
})

describe('validation', () => {
  it('rejects a request without an id', async () => {
    await expect(handler(makeEvent('/api/v1/shows/'))).rejects.toMatchObject({
      status: 400,
      message: 'Invalid show id'
    })
    expect(mocks.fetchShow).not.toHaveBeenCalled()
  })

  it('rejects an empty id', async () => {
    await expect(handler(makeEvent('/api/v1/shows/', { id: '' }))).rejects.toMatchObject({ status: 400 })
  })

  it('rejects a non-numeric id', async () => {
    await expect(handler(makeEvent('/api/v1/shows/abc', { id: 'abc' }))).rejects.toMatchObject({ status: 400 })
  })

  it('rejects an id that only starts with digits', async () => {
    await expect(handler(makeEvent('/api/v1/shows/12abc', { id: '12abc' }))).rejects.toMatchObject({ status: 400 })
    expect(mocks.fetchShow).not.toHaveBeenCalled()
    expect(mocks.fetchImages).not.toHaveBeenCalled()
  })

  it('rejects a negative or fractional id', async () => {
    await expect(handler(makeEvent('/api/v1/shows/-1', { id: '-1' }))).rejects.toMatchObject({ status: 400 })
    await expect(handler(makeEvent('/api/v1/shows/1.5', { id: '1.5' }))).rejects.toMatchObject({ status: 400 })
  })
})

describe('detail', () => {
  it('asks upstream for the show and its images with the numeric id', async () => {
    await handler(makeEvent('/api/v1/shows/82', { id: '82' }))

    expect(mocks.fetchShow).toHaveBeenCalledExactlyOnceWith(82)
    expect(mocks.fetchImages).toHaveBeenCalledExactlyOnceWith(82)
  })

  it('returns the mapped detail together with the picked backdrop', async () => {
    mocks.fetchShow.mockResolvedValue(makeShow({ id: 82, summary: '<p>A dome &amp; a town</p>' }))
    mocks.fetchImages.mockResolvedValue([
      makeImage({ id: 1, type: 'poster' }),
      makeImage({ id: 2, main: true, resolutions: { original: { url: 'https://img/main.jpg', width: 1, height: 1 } } })
    ])

    const detail = await handler(makeEvent('/api/v1/shows/82', { id: '82' }))

    expect(detail.id).toBe(82)
    expect(detail.name).toBe('Under the Dome')
    expect(detail.summary).toBe('A dome & a town')
    expect(detail.status).toBe('Ended')
    expect(detail.runtime).toBe(60)
    expect(detail.poster).toBe('https://img/medium.jpg')
    expect(detail.backdrop).toBe('https://img/main.jpg')
  })

  it('maps the embedded seasons, cast and crew of the fetched show', async () => {
    mocks.fetchShow.mockResolvedValue(makeShow({
      _embedded: {
        cast: [{
          self: false,
          voice: false,
          person: { id: 5, name: 'Mike Vogel', image: null },
          character: { id: 6, name: 'Dale Barbara', image: null }
        }],
        crew: [{ type: 'Creator', person: { id: 7, name: 'Brian K. Vaughan', image: null } }],
        seasons: [{
          id: 1,
          number: 1,
          name: 'Season 1',
          endDate: null,
          image: null,
          premiereDate: '2013-06-24',
          episodeOrder: 13
        }]
      }
    }))

    const detail = await handler(makeEvent('/api/v1/shows/1', { id: '1' }))

    expect(detail.seasonCount).toBe(1)
    expect(detail.episodeCount).toBe(13)
    expect(detail.creators).toEqual(['Brian K. Vaughan'])
    expect(detail.cast).toEqual([{ id: 5, person: 'Mike Vogel', character: 'Dale Barbara', image: null }])
  })

  it('leaves the backdrop null when upstream has no background image', async () => {
    mocks.fetchImages.mockResolvedValue([makeImage({ type: 'poster' })])

    expect((await handler(makeEvent('/api/v1/shows/1', { id: '1' }))).backdrop).toBeNull()
  })

  it('leaves the backdrop null when upstream returns no images at all', async () => {
    expect((await handler(makeEvent('/api/v1/shows/1', { id: '1' }))).backdrop).toBeNull()
  })

  it('lets an upstream failure bubble up', async () => {
    mocks.fetchShow.mockRejectedValue(new Error('TVmaze is unreachable'))

    await expect(handler(makeEvent('/api/v1/shows/1', { id: '1' }))).rejects.toThrow('TVmaze is unreachable')
  })
})
