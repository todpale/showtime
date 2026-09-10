import { it, expect, describe } from 'vitest'
import type { TvmazeShow, TvmazeEpisode, TvmazeShowImage } from '@/models'
import { toYear, toDetail, stripHtml, toEpisode, toSummary, pickBackdrop } from '../mappers'

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

function makeImage(overrides: Partial<TvmazeShowImage> = {}): TvmazeShowImage {
  return {
    id: 100,
    main: false,
    type: 'background',
    resolutions: { original: { url: 'https://img/bg.jpg', width: 1920, height: 1080 } },
    ...overrides
  }
}

describe('stripHtml', () => {
  it('returns an empty string for a missing summary', () => {
    expect(stripHtml(null)).toBe('')
    expect(stripHtml('')).toBe('')
  })

  it('removes html tags but keeps the text', () => {
    expect(stripHtml('<p>Hello <b>world</b></p>')).toBe('Hello world')
  })

  it('decodes the html entities the API sends', () => {
    expect(stripHtml('Tom &amp; Jerry')).toBe('Tom & Jerry')
    expect(stripHtml('&quot;quoted&quot;')).toBe('"quoted"')
    expect(stripHtml('it&#39;s')).toBe('it\'s')
    expect(stripHtml('&lt;tag&gt;')).toBe('<tag>')
    expect(stripHtml('a&nbsp;b')).toBe('a b')
  })

  it('collapses runs of whitespace and trims the edges', () => {
    expect(stripHtml('  <p>one</p>\n\n  <p>two</p>  ')).toBe('one two')
  })
})

describe('toYear', () => {
  it('reads the year out of an ISO date', () => {
    expect(toYear('2013-06-24')).toBe(2013)
  })

  it('returns null when there is no date', () => {
    expect(toYear(null)).toBeNull()
    expect(toYear('')).toBeNull()
  })

  it('returns null when the date does not start with a year', () => {
    expect(toYear('soon')).toBeNull()
  })
})

describe('toSummary', () => {
  it('maps a TVmaze show onto the catalogue summary shape', () => {
    expect(toSummary(makeShow())).toEqual({
      id: 1,
      name: 'Under the Dome',
      type: 'Scripted',
      genres: ['Drama', 'Science-Fiction'],
      year: 2013,
      rating: 6.5,
      network: 'CBS',
      poster: 'https://img/medium.jpg',
      backdrop: null,
      posterLarge: 'https://img/original.jpg'
    })
  })

  it('falls back to the web channel when there is no network', () => {
    const summary = toSummary(makeShow({ network: null, webChannel: { id: 9, name: 'Netflix', country: null } }))

    expect(summary.network).toBe('Netflix')
  })

  it('uses null for an absent rating, image and network', () => {
    const summary = toSummary(makeShow({ rating: { average: null }, image: null, network: null }))

    expect(summary.rating).toBeNull()
    expect(summary.poster).toBeNull()
    expect(summary.posterLarge).toBeNull()
    expect(summary.network).toBeNull()
  })
})

describe('toDetail', () => {
  it('keeps every summary field and adds the detail fields', () => {
    const detail = toDetail(makeShow({ summary: '<p>A dome &amp; a town</p>' }))

    expect(detail.id).toBe(1)
    expect(detail.poster).toBe('https://img/medium.jpg')
    expect(detail.summary).toBe('A dome & a town')
    expect(detail.status).toBe('Ended')
    expect(detail.language).toBe('English')
    expect(detail.premiered).toBe('2013-06-24')
  })

  it('prefers the declared runtime and falls back to the average runtime', () => {
    expect(toDetail(makeShow()).runtime).toBe(60)
    expect(toDetail(makeShow({ runtime: null })).runtime).toBe(45)
  })

  it('maps seasons and totals their episode orders', () => {
    const detail = toDetail(makeShow({
      _embedded: {
        seasons: [
          {
            id: 1,
            number: 1,
            name: 'Season 1',
            endDate: null,
            image: null,
            premiereDate: '2013-06-24',
            episodeOrder: 13
          },
          {
            id: 2,
            number: 2,
            name: null,
            endDate: null,
            image: null,
            premiereDate: null,
            episodeOrder: null
          }
        ]
      }
    }))

    expect(detail.seasons).toEqual([
      { id: 1, number: 1, name: 'Season 1', year: 2013, episodeCount: 13 },
      { id: 2, number: 2, name: null, year: null, episodeCount: 0 }
    ])
    expect(detail.seasonCount).toBe(2)
    expect(detail.episodeCount).toBe(13)
  })

  it('caps the cast at twelve members', () => {
    const cast = Array.from({ length: 15 }, (_, index) => ({
      self: false,
      voice: false,
      person: { id: index, name: `Person ${index}`, image: null },
      character: { id: index, name: `Character ${index}`, image: null }
    }))
    const detail = toDetail(makeShow({ _embedded: { cast } }))

    expect(detail.cast).toHaveLength(12)
    expect(detail.cast[0]).toEqual({ id: 0, person: 'Person 0', character: 'Character 0', image: null })
  })

  it('lists unique creators from the crew and ignores other crew roles', () => {
    const detail = toDetail(makeShow({
      _embedded: {
        crew: [
          { type: 'Creator', person: { id: 1, name: 'Brian K. Vaughan', image: null } },
          { type: 'Executive Producer', person: { id: 2, name: 'Neal Baer', image: null } },
          { type: 'Co-Creator', person: { id: 3, name: 'Jane Doe', image: null } },
          { type: 'Developed by', person: { id: 1, name: 'Brian K. Vaughan', image: null } }
        ]
      }
    }))

    expect(detail.creators).toEqual(['Brian K. Vaughan', 'Jane Doe'])
    expect(detail.crew).toHaveLength(4)
  })

  it('handles a show without embedded data', () => {
    const detail = toDetail(makeShow())

    expect(detail.cast).toEqual([])
    expect(detail.crew).toEqual([])
    expect(detail.creators).toEqual([])
    expect(detail.seasons).toEqual([])
    expect(detail.seasonCount).toBe(0)
    expect(detail.episodeCount).toBe(0)
    expect(detail.summary).toBe('')
  })
})

describe('pickBackdrop', () => {
  it('prefers the main background image', () => {
    const images: TvmazeShowImage[] = [
      makeImage({ id: 1, resolutions: { original: { url: 'https://img/first.jpg', width: 1, height: 1 } } }),
      makeImage({ id: 2, main: true, resolutions: { original: { url: 'https://img/main.jpg', width: 1, height: 1 } } })
    ]

    expect(pickBackdrop(images)).toBe('https://img/main.jpg')
  })

  it('falls back to the first background when none is marked main', () => {
    const images: TvmazeShowImage[] = [
      makeImage({ id: 1, type: 'poster' }),
      makeImage({ id: 2, resolutions: { original: { url: 'https://img/second.jpg', width: 1, height: 1 } } })
    ]

    expect(pickBackdrop(images)).toBe('https://img/second.jpg')
  })

  it('returns null when there is no background image', () => {
    expect(pickBackdrop([])).toBeNull()
    expect(pickBackdrop([makeImage({ type: 'poster' })])).toBeNull()
  })
})

describe('toEpisode', () => {
  it('maps a TVmaze episode onto the app episode shape', () => {
    expect(toEpisode(makeEpisode({ summary: '<p>Pilot &quot;one&quot;</p>' }))).toEqual({
      id: 10,
      name: 'Pilot',
      season: 1,
      number: 1,
      airdate: '2013-06-24',
      runtime: 60,
      summary: 'Pilot "one"',
      rating: 7.8,
      image: 'https://img/still.jpg'
    })
  })

  it('uses null for a missing rating and image, and an empty summary', () => {
    const episode = toEpisode(makeEpisode({ rating: { average: null }, image: null, summary: null }))

    expect(episode.rating).toBeNull()
    expect(episode.image).toBeNull()
    expect(episode.summary).toBe('')
  })
})
