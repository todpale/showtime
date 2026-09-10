import type { ShowSummary } from '@/models'
import { isStale, slugify, compareShows } from '../genres'
import { it, vi, expect, describe, afterEach } from 'vitest'

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

describe('slugify', () => {
  it('lowercases a genre name', () => {
    expect(slugify('Drama')).toBe('drama')
  })

  it('turns separators into single dashes', () => {
    expect(slugify('Science-Fiction')).toBe('science-fiction')
    expect(slugify('Action & Adventure')).toBe('action-adventure')
  })

  it('trims leading and trailing dashes', () => {
    expect(slugify(' Drama ')).toBe('drama')
    expect(slugify('---')).toBe('')
  })

  it('keeps digits', () => {
    expect(slugify('Top 10')).toBe('top-10')
  })
})

describe('compareShows', () => {
  it('orders higher ratings first', () => {
    const order = [makeShow({ id: 1, rating: 6.1 }), makeShow({ id: 2, rating: 9.2 })].sort(compareShows)

    expect(order.map((show) => show.id)).toEqual([2, 1])
  })

  it('keeps unrated shows and puts them last', () => {
    const shows = [
      makeShow({ id: 1, rating: null }),
      makeShow({ id: 2, rating: 5 }),
      makeShow({ id: 3, rating: null }),
      makeShow({ id: 4, rating: 8 })
    ]
    const order = shows.sort(compareShows)

    expect(order).toHaveLength(4)
    expect(order.map((show) => show.id)).toEqual([4, 2, 1, 3])
  })

  it('breaks a rating tie by name, then by id', () => {
    const shows = [
      makeShow({ id: 30, name: 'Zulu', rating: 8 }),
      makeShow({ id: 20, name: 'Alpha', rating: 8 }),
      makeShow({ id: 10, name: 'Alpha', rating: 8 })
    ]
    const order = shows.sort(compareShows)

    expect(order.map((show) => show.id)).toEqual([10, 20, 30])
  })

  it('produces the same order regardless of the input order', () => {
    const build = (): ShowSummary[] => [
      makeShow({ id: 3, name: 'Cee', rating: null }),
      makeShow({ id: 1, name: 'Aay', rating: 8 }),
      makeShow({ id: 2, name: 'Bee', rating: 8 })
    ]
    const forwards = build().sort(compareShows).map((show) => show.id)
    const backwards = build().reverse().sort(compareShows).map((show) => show.id)

    expect(forwards).toEqual([1, 2, 3])
    expect(backwards).toEqual([1, 2, 3])
  })
})

describe('isStale', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('treats a missing value as stale', () => {
    expect(isStale(null)).toBe(true)
  })

  it('treats a value fetched just now as fresh', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))

    expect(isStale({ fetchedAt: Date.now() })).toBe(false)
  })

  it('treats a value fetched over a day ago as stale', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-02T00:00:01Z'))

    expect(isStale({ fetchedAt: new Date('2026-01-01T00:00:00Z').getTime() })).toBe(true)
  })

  it('treats a value fetched exactly a day ago as fresh', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-02T00:00:00Z'))

    expect(isStale({ fetchedAt: new Date('2026-01-01T00:00:00Z').getTime() })).toBe(false)
  })
})
