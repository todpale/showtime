import { it, expect, describe } from 'vitest'
import type { ShowSummary, CatalogFilters } from '@/models'
import { toSort, toNumber, yearFacet, toFilters, sortShows, applyFilters, YEAR_FACET_LIMIT } from '../catalog'

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

describe('toSort', () => {
  it('accepts every supported sort key', () => {
    expect(toSort('rating')).toBe('rating')
    expect(toSort('year')).toBe('year')
    expect(toSort('name')).toBe('name')
    expect(toSort('relevance')).toBe('relevance')
  })

  it('falls back to rating for an unknown value', () => {
    expect(toSort('popularity')).toBe('rating')
    expect(toSort(undefined)).toBe('rating')
    expect(toSort(7)).toBe('rating')
  })

  it('uses the given fallback when the value is unusable', () => {
    expect(toSort(null, 'relevance')).toBe('relevance')
  })
})

describe('toNumber', () => {
  it('parses numeric query strings', () => {
    expect(toNumber('2013')).toBe(2013)
    expect(toNumber('7.5')).toBe(7.5)
    expect(toNumber(0)).toBe(0)
  })

  it('returns null for absent values', () => {
    expect(toNumber(undefined)).toBeNull()
    expect(toNumber(null)).toBeNull()
    expect(toNumber('')).toBeNull()
  })

  it('returns null for values that are not finite numbers', () => {
    expect(toNumber('abc')).toBeNull()
    expect(toNumber(Number.POSITIVE_INFINITY)).toBeNull()
  })
})

describe('toFilters', () => {
  it('reads year, genre and minimum rating from the query', () => {
    expect(toFilters({ year: '2013', genre: 'drama', minRating: '8' })).toEqual({
      year: 2013,
      genre: 'drama',
      minRating: 8
    })
  })

  it('nulls out anything missing or empty', () => {
    expect(toFilters({})).toEqual({ year: null, genre: null, minRating: null })
    expect(toFilters({ genre: '', year: '', minRating: '' })).toEqual({
      year: null,
      genre: null,
      minRating: null
    })
  })

  it('ignores a non-string genre', () => {
    expect(toFilters({ genre: 5 }).genre).toBeNull()
  })
})

describe('applyFilters', () => {
  const shows = [
    makeShow({ id: 1, rating: 9, year: 2020, genres: ['Drama'] }),
    makeShow({ id: 2, rating: 6, year: 2013, genres: ['Comedy', 'Science-Fiction'] }),
    makeShow({ id: 3, rating: null, year: 2020, genres: ['Drama', 'Comedy'] })
  ]

  it('returns every show when no filter is set', () => {
    const result = applyFilters(shows, { year: null, genre: null, minRating: null })

    expect(result.map((show) => show.id)).toEqual([1, 2, 3])
  })

  it('drops shows below the minimum rating, including unrated ones', () => {
    const result = applyFilters(shows, { year: null, genre: null, minRating: 7 })

    expect(result.map((show) => show.id)).toEqual([1])
  })

  it('keeps only shows from the requested year', () => {
    const result = applyFilters(shows, { year: 2013, genre: null, minRating: null })

    expect(result.map((show) => show.id)).toEqual([2])
  })

  it('matches the genre filter against the slug of each genre', () => {
    const result = applyFilters(shows, { year: null, genre: 'science-fiction', minRating: null })

    expect(result.map((show) => show.id)).toEqual([2])
  })

  it('combines the filters', () => {
    const result = applyFilters(shows, { year: 2020, genre: 'drama', minRating: 8 })

    expect(result.map((show) => show.id)).toEqual([1])
  })

  it('returns an empty list when nothing matches', () => {
    expect(applyFilters(shows, { year: 1999, genre: null, minRating: null })).toEqual([])
  })

  it('does not mutate the input list', () => {
    const input = [...shows]

    applyFilters(input, { year: 2013, genre: null, minRating: null })

    expect(input).toHaveLength(3)
  })
})

describe('sortShows', () => {
  const shows = [
    makeShow({ id: 1, name: 'Bee', rating: 7, year: 2001 }),
    makeShow({ id: 2, name: 'Aay', rating: 9, year: 1999 }),
    makeShow({ id: 3, name: 'Cee', rating: null, year: 2020 })
  ]

  it('sorts by rating with unrated shows last', () => {
    expect(sortShows(shows, 'rating').map((show) => show.id)).toEqual([2, 1, 3])
  })

  it('sorts by newest year first', () => {
    expect(sortShows(shows, 'year').map((show) => show.id)).toEqual([3, 1, 2])
  })

  it('breaks a year tie with the rating order', () => {
    const sameYear = [
      makeShow({ id: 1, name: 'Bee', rating: 7, year: 2001 }),
      makeShow({ id: 2, name: 'Aay', rating: 9, year: 2001 })
    ]

    expect(sortShows(sameYear, 'year').map((show) => show.id)).toEqual([2, 1])
  })

  it('sorts by name alphabetically', () => {
    expect(sortShows(shows, 'name').map((show) => show.id)).toEqual([2, 1, 3])
  })

  it('breaks a name tie by id', () => {
    const sameName = [makeShow({ id: 9, name: 'Aay' }), makeShow({ id: 4, name: 'Aay' })]

    expect(sortShows(sameName, 'name').map((show) => show.id)).toEqual([4, 9])
  })

  it('keeps the incoming order for relevance', () => {
    expect(sortShows(shows, 'relevance').map((show) => show.id)).toEqual([1, 2, 3])
  })

  it('never drops a show', () => {
    expect(sortShows(shows, 'rating')).toHaveLength(3)
    expect(sortShows(shows, 'year')).toHaveLength(3)
    expect(sortShows(shows, 'name')).toHaveLength(3)
  })

  it('does not mutate the input list', () => {
    const input = [...shows]

    sortShows(input, 'rating')

    expect(input.map((show) => show.id)).toEqual([1, 2, 3])
  })
})

describe('yearFacet', () => {
  const shows = [
    makeShow({ id: 1, year: 2018, rating: 9, genres: ['Drama'] }),
    makeShow({ id: 2, year: 2018, rating: 6, genres: ['Drama'] }),
    makeShow({ id: 3, year: 2017, rating: 8, genres: ['Drama', 'Comedy'] }),
    makeShow({ id: 4, year: 2016, rating: 7, genres: ['Drama'] }),
    makeShow({ id: 5, year: 2015, rating: 9, genres: ['Comedy'] }),
    makeShow({ id: 6, year: 2014, rating: 5, genres: ['Drama'] }),
    makeShow({ id: 7, year: 2013, rating: 8, genres: ['Drama'] }),
    makeShow({ id: 8, year: 2012, rating: 7, genres: ['Drama'] }),
    makeShow({ id: 9, year: null, rating: 9, genres: ['Drama'] })
  ]

  const noFilters: CatalogFilters = { year: null, genre: null, minRating: null }

  function everyOfferedYearMatches(bucket: ShowSummary[], filters: CatalogFilters): boolean {
    return yearFacet(bucket, filters)
      .filter((year) => year !== filters.year)
      .every((year) => applyFilters(bucket, { ...filters, year }).length > 0)
  }

  function offersTheActiveYear(bucket: ShowSummary[], filters: CatalogFilters): boolean {
    return filters.year === null || yearFacet(bucket, filters).includes(filters.year)
  }

  it('caps the chips at six years by default', () => {
    expect(YEAR_FACET_LIMIT).toBe(6)
    expect(yearFacet(shows, noFilters)).toEqual([2018,
      2017,
      2016,
      2015,
      2014,
      2013])
  })

  it('offers each year once, newest first', () => {
    const years = yearFacet(shows, noFilters)

    expect(years).toEqual([...years].sort((a, b) => b - a))
    expect(new Set(years).size).toBe(years.length)
  })

  it('offers only years that have a show behind them, the selected one aside', () => {
    expect(everyOfferedYearMatches(shows, noFilters)).toBe(true)
    expect(everyOfferedYearMatches(shows, { ...noFilters, minRating: 8 })).toBe(true)
    expect(everyOfferedYearMatches(shows, { ...noFilters, genre: 'comedy' })).toBe(true)
    expect(everyOfferedYearMatches(shows, { ...noFilters, minRating: 7, genre: 'drama' })).toBe(true)
    expect(everyOfferedYearMatches(shows, { ...noFilters, year: 2012, minRating: 7 })).toBe(true)
    expect(everyOfferedYearMatches(shows, { ...noFilters, year: 2014, minRating: 9 })).toBe(true)
    expect(everyOfferedYearMatches(shows, { ...noFilters, year: 1999 })).toBe(true)
    expect(everyOfferedYearMatches(shows, { ...noFilters, year: 2018, minRating: 10 })).toBe(true)
  })

  it('offers the selected year whatever the other filters leave behind', () => {
    expect(offersTheActiveYear(shows, { ...noFilters, year: 2018 })).toBe(true)
    expect(offersTheActiveYear(shows, { ...noFilters, year: 2012, minRating: 7 })).toBe(true)
    expect(offersTheActiveYear(shows, { ...noFilters, year: 2014, minRating: 9 })).toBe(true)
    expect(offersTheActiveYear(shows, { ...noFilters, year: 1999 })).toBe(true)
    expect(offersTheActiveYear(shows, { ...noFilters, year: 2018, genre: 'western' })).toBe(true)
    expect(offersTheActiveYear([], { ...noFilters, year: 2018 })).toBe(true)
  })

  it('keeps offering the other years while a year is selected', () => {
    expect(yearFacet(shows, { ...noFilters, year: 2018 })).toEqual([2018,
      2017,
      2016,
      2015,
      2014,
      2013])
  })

  it('narrows the years to the ones left by the rating filter', () => {
    expect(yearFacet(shows, { ...noFilters, minRating: 9 })).toEqual([2018, 2015])
  })

  it('narrows the years to the ones left by the genre filter', () => {
    expect(yearFacet(shows, { ...noFilters, genre: 'comedy' })).toEqual([2017, 2015])
  })

  it('never offers a year that the other filters rule out while no year is selected', () => {
    expect(yearFacet(shows, { ...noFilters, minRating: 9 })).not.toContain(2017)
    expect(yearFacet(shows, { ...noFilters, genre: 'comedy' })).not.toContain(2018)
  })

  it('leaves out the shows that have no year', () => {
    expect(yearFacet(shows, noFilters)).not.toContain(null)
    expect(yearFacet([makeShow({ id: 1, year: null })], noFilters)).toEqual([])
  })

  it('keeps the selected year on screen when it sits past the cap', () => {
    const years = yearFacet(shows, { ...noFilters, year: 2012 })

    expect(years).toContain(2012)
    expect(years).toEqual([2018,
      2017,
      2016,
      2015,
      2014,
      2012])
    expect(years).toHaveLength(YEAR_FACET_LIMIT)
  })

  it('keeps the pinned list newest first', () => {
    const years = yearFacet(shows, { ...noFilters, year: 2012 }, 3)

    expect(years).toEqual([2018, 2017, 2012])
  })

  it('pins a selected year that no show can match, dropping the oldest offer instead', () => {
    const years = yearFacet(shows, { ...noFilters, year: 1999 })

    expect(years).toEqual([2018,
      2017,
      2016,
      2015,
      2014,
      1999])
    expect(years).toHaveLength(YEAR_FACET_LIMIT)
  })

  it('keeps the selected year on offer once the other filters leave it empty', () => {
    expect(yearFacet(shows, { ...noFilters, minRating: 9 })).toEqual([2018, 2015])
    expect(yearFacet(shows, { ...noFilters, year: 2014, minRating: 9 })).toEqual([2018, 2015, 2014])
  })

  it('never offers more than the limit, the pinned year included', () => {
    for (const limit of [1, 2, 3, 6]) {
      expect(yearFacet(shows, { ...noFilters, year: 1999 }, limit)).toHaveLength(limit)
    }
  })

  it('honours a custom limit', () => {
    expect(yearFacet(shows, noFilters, 3)).toEqual([2018, 2017, 2016])
    expect(yearFacet(shows, noFilters, 99)).toEqual([2018,
      2017,
      2016,
      2015,
      2014,
      2013,
      2012])
  })

  it('offers nothing for an empty bucket', () => {
    expect(yearFacet([], noFilters)).toEqual([])
  })

  it('still offers the selected year for an empty bucket', () => {
    expect(yearFacet([], { ...noFilters, year: 2018 })).toEqual([2018])
  })

  it('offers nothing when the other filters match no show at all', () => {
    expect(yearFacet(shows, { ...noFilters, minRating: 10 })).toEqual([])
    expect(yearFacet(shows, { ...noFilters, genre: 'western' })).toEqual([])
  })

  it('offers just the selected year when the other filters match no show at all', () => {
    expect(yearFacet(shows, { ...noFilters, year: 2018, minRating: 10 })).toEqual([2018])
    expect(yearFacet(shows, { ...noFilters, year: 2018, genre: 'western' })).toEqual([2018])
  })

  it('does not mutate the bucket', () => {
    const input = [...shows]

    yearFacet(input, { ...noFilters, year: 2012 })

    expect(input.map((show) => show.id)).toEqual([1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9])
  })
})
