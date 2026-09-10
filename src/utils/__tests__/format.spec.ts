import type { ShowSummary } from '@/models'
import { it, expect, describe } from 'vitest'
import { joinMeta, metaParts, ratingText } from '@/utils/format'

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

describe('ratingText', () => {
  it('shows an em dash when a show has no rating', () => {
    expect(ratingText(null)).toBe('—')
  })

  it('always shows one decimal', () => {
    expect(ratingText(8)).toBe('8.0')
    expect(ratingText(6.5)).toBe('6.5')
    expect(ratingText(0)).toBe('0.0')
  })

  it('rounds to one decimal', () => {
    expect(ratingText(9.25)).toBe('9.3')
  })
})

describe('metaParts', () => {
  it('lists at most two genres and then the year', () => {
    const parts = metaParts(makeShow({ genres: ['Drama', 'Thriller', 'Crime'], year: 2013 }))

    expect(parts).toEqual(['Drama, Thriller', '2013'])
  })

  it('omits the genres when the show has none', () => {
    expect(metaParts(makeShow({ genres: [], year: 2013 }))).toEqual(['2013'])
  })

  it('omits the year when the show has none', () => {
    expect(metaParts(makeShow({ genres: ['Drama'], year: null }))).toEqual(['Drama'])
  })

  it('returns nothing when there is no genre and no year', () => {
    expect(metaParts(makeShow({ genres: [], year: null }))).toEqual([])
  })
})

describe('joinMeta', () => {
  it('joins the parts with a middle dot', () => {
    expect(joinMeta(['Drama', '2013'])).toBe('Drama · 2013')
  })

  it('skips empty, null and undefined parts', () => {
    expect(joinMeta(['Drama',
      null,
      '',
      undefined,
      'CBS'])).toBe('Drama · CBS')
  })

  it('returns an empty string when nothing is left', () => {
    expect(joinMeta([null, undefined, ''])).toBe('')
  })
})
