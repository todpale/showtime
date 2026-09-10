import type { Catalog, SeedShow } from './types'
import type { Episode, ShowDetail, ShowSummary, EpisodeGroup, GenreSummary } from '@/models'

const FEATURED = ['drama', 'comedy', 'sports']
const EMPTY_GENRE: GenreSummary = { name: 'Documentary', slug: 'documentary', total: 0 }
const LONG_TITLE = 'The Long Road Home Through the Quiet Valley of Old Caledonia'

const DRAMA: SeedShow[] = [
  {
    id: 1,
    name: 'Nightfall County',
    rating: 9.4,
    year: 2024,
    genres: ['Drama', 'Crime', 'Mystery'],
    network: 'HBO',
    seasons: [10, 10, 10],
    cast: ['Maren Okafor',
      'Diego Salas',
      'Ruth Kellaway',
      'Ivo Lindqvist',
      'Tessa Aurelio'],
    creators: ['Anna Petrossian', 'Wes Bramwell'],
    episodeNames: { '1:1': 'Ash Wednesday', '1:2': 'The Long Field', '1:3': 'Salt Water', '1:4': 'Nobody\'s Boy' },
    runtimes: { '1:1': 58, '1:2': 54, '1:3': 51, '1:4': 56 }
  },
  { id: 2, name: 'Ashfall County', rating: 9.3, year: 2021, genres: ['Drama'] },
  { id: 3, name: 'The Quiet Ward', rating: 9.1, year: 2023, genres: ['Drama'] },
  { id: 4, name: 'The Quiet Hours', rating: 9.0, year: 2023, genres: ['Drama'] },
  { id: 5, name: 'Ash & Iron', rating: 8.9, year: 2022, genres: ['Drama'] },
  { id: 6, name: 'Northern Light', rating: 8.8, year: 2022, genres: ['Drama'] },
  { id: 7, name: 'Harbor Lights', rating: 8.7, year: 2024, genres: ['Drama'] },
  { id: 8, name: 'Cinderhouse', rating: 8.6, year: 2020, genres: ['Drama'] },
  { id: 9, name: 'Blackwater Bay', rating: 8.5, year: 2023, genres: ['Drama'] },
  { id: 10, name: 'The Long Shift', rating: 8.4, year: 2019, genres: ['Drama'] },
  { id: 11, name: 'Paper Kingdom', rating: 8.3, year: 2022, genres: ['Drama'] },
  { id: 12, name: 'Salt & Ember', rating: 8.2, year: 2021, genres: ['Drama'] }
]

const COMEDY: SeedShow[] = [
  { id: 21, name: 'Roommates', rating: 9.0, year: 2023, genres: ['Comedy'] },
  { id: 22, name: 'Second Helpings', rating: 8.8, year: 2022, genres: ['Comedy'] },
  { id: 23, name: 'The Understudy', rating: 8.6, year: 2024, genres: ['Comedy'] },
  { id: 24, name: 'Neighbors', rating: 8.4, year: 2021, genres: ['Comedy'] },
  { id: 25, name: 'Office Hours', rating: 8.2, year: 2020, genres: ['Comedy'] },
  { id: 26, name: 'Sunday League', rating: 8.0, year: 2019, genres: ['Comedy'] },
  { id: 27, name: 'The Cul-de-sac', rating: 7.8, year: 2018, genres: ['Comedy'] }
]

const SPORTS: SeedShow[] = [
  { id: 31, name: 'Full Count', rating: 9.2, year: 2024, genres: ['Sports'], network: 'ESPN' },
  { id: 32, name: 'The Bench', rating: 9.0, year: 2023, genres: ['Sports'] },
  { id: 33, name: 'Iron Season', rating: 8.8, year: 2022, genres: ['Sports'] },
  { id: 34, name: 'Match Point', rating: 8.6, year: 2021, genres: ['Sports'] },
  { id: 35, name: 'Ninety Minutes', rating: 8.4, year: 2020, genres: ['Sports'] },
  { id: 36, name: 'Track & Field', rating: 8.1, year: 2019, genres: ['Sports'] },
  { id: 37, name: 'Downhill', rating: 7.9, year: 2018, genres: ['Sports'] }
]

const BRE: SeedShow[] = [
  { id: 41, name: 'Breakwater', rating: 9.4, year: 2023, genres: ['Crime', 'Thriller'], network: 'AMC', score: 28 },
  { id: 42, name: 'The Brennan Line', rating: 8.8, year: 2021, genres: ['Thriller'], score: 22 },
  {
    id: 43,
    name: 'Bright Hollow',
    rating: 8.6,
    year: 2022,
    genres: ['Mystery', 'Horror'],
    score: 30,
    keywords: ['bre']
  },
  {
    id: 44,
    name: 'Brimstone County',
    rating: 8.2,
    year: 2020,
    genres: ['Crime', 'Horror'],
    score: 20,
    keywords: ['bre']
  },
  { id: 45, name: 'Brenner Files', rating: 7.9, year: 2019, genres: ['Crime', 'Thriller'], score: 25 }
]

const EDGE: SeedShow[] = [
  { id: 51, name: 'Lone Mesa', rating: 8.0, year: 2021, genres: ['Western'] },
  { id: 71, name: LONG_TITLE, rating: 7.5, year: 2016, genres: ['Drama'] },
  { id: 72, name: 'Standing Stone', rating: 7.4, year: 2015, genres: ['Drama'], seasons: [] }
]

const TIED: SeedShow[] = [
  { id: 61, name: 'Amber Coast', rating: 8.5, year: 2020, genres: ['Drama'] },
  { id: 62, name: 'Zero Hour', rating: 8.5, year: 2021, genres: ['Drama'] }
]

const ADJECTIVES = [
  'Amber',
  'Broken',
  'Copper',
  'Distant',
  'Eastern',
  'Fading',
  'Gilded',
  'Hollow',
  'Iron',
  'Jade',
  'Kindred',
  'Lantern'
]
const NOUNS = ['Road',
  'River',
  'Season',
  'Harbor',
  'Ridge',
  'Field']
const FILLER_YEARS = [2019,
  2020,
  2021,
  2018,
  2017]

function fillerRating(index: number): number {
  if (index < 8) {
    return 8.1
  }

  if (index < 16) {
    return 8.0
  }

  if (index < 24) {
    return 7.9
  }

  return index < 30 ? 7.8 : 7.7
}

function fillers(): SeedShow[] {
  return Array.from({ length: 36 }, (_, index) => ({
    id: 101 + index,
    name: `${ADJECTIVES[index % ADJECTIVES.length]} ${NOUNS[Math.floor(index / ADJECTIVES.length)]}`,
    rating: fillerRating(index),
    year: FILLER_YEARS[index % FILLER_YEARS.length] ?? 2019,
    genres: ['Drama']
  }))
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function compareShows(a: ShowSummary, b: ShowSummary): number {
  const left = a.rating ?? -1
  const right = b.rating ?? -1

  if (left !== right) {
    return right - left
  }

  const byName = a.name.localeCompare(b.name)

  return byName === 0 ? a.id - b.id : byName
}

function toSummary(seed: SeedShow): ShowSummary {
  const poster = seed.poster === false ? null : `https://example.test/p/${seed.id}.jpg`

  return {
    id: seed.id,
    name: seed.name,
    genres: seed.genres,
    type: 'Scripted',
    year: seed.year,
    rating: seed.rating,
    poster,
    network: seed.network ?? null,
    backdrop: `https://example.test/b/${seed.id}.jpg`,
    posterLarge: poster
  }
}

function summaryText(seed: SeedShow): string {
  return seed.summary
    ?? `${seed.name} follows a close-knit group whose quiet lives unravel over one long ${seed.year} season.`
}

function toEpisodes(seed: SeedShow): EpisodeGroup[] {
  const seasons = seed.seasons ?? [3, 3]

  return seasons.map((count, seasonIndex) => {
    const season = seasonIndex + 1
    const episodes: Episode[] = Array.from({ length: count }, (_, episodeIndex) => {
      const number = episodeIndex + 1
      const key = `${season}:${number}`
      const id = seed.id * 1000 + season * 100 + number

      return {
        id,
        name: seed.episodeNames?.[key] ?? `Episode ${number} of Season ${season}`,
        season,
        summary: `Season ${season}, episode ${number} of ${seed.name}: the story continues.`,
        image: `https://example.test/e/${id}.jpg`,
        number,
        rating: 7 + ((number % 5) / 10),
        airdate: `${seed.year}-0${(season % 9) + 1}-${String(number).padStart(2, '0')}`,
        runtime: seed.runtimes?.[key] ?? 45
      }
    })

    return { season, episodes }
  })
}

function toDetail(seed: SeedShow, groups: EpisodeGroup[]): ShowDetail {
  const cast = (seed.cast ?? ['Lena Marsh', 'Tomas Reyes', 'Ada Whitfield']).map((person, index) => ({
    id: seed.id * 10 + index,
    person,
    character: `Character ${index + 1}`,
    image: `https://example.test/c/${seed.id}-${index}.jpg`
  }))
  const creators = seed.creators ?? ['Jordan Vale']

  return {
    ...toSummary(seed),
    summary: summaryText(seed),
    cast,
    crew: creators.map((person, index) => ({ id: seed.id * 100 + index, type: 'Creator', person })),
    creators,
    seasonCount: groups.length,
    ended: null,
    episodeCount: groups.reduce((sum, group) => sum + group.episodes.length, 0),
    status: 'Running',
    runtime: 50,
    language: 'English',
    premiered: `${seed.year}-01-15`,
    seasons: groups.map((group) => ({
      id: seed.id * 10000 + group.season,
      number: group.season,
      name: null,
      year: seed.year + group.season - 1,
      episodeCount: group.episodes.length
    }))
  }
}

function buildGenres(shows: ShowSummary[]): GenreSummary[] {
  const buckets = new Map<string, GenreSummary>()

  for (const show of shows) {
    for (const genre of show.genres) {
      const slug = slugify(genre)
      const bucket = buckets.get(slug) ?? { name: genre, slug, total: 0 }

      bucket.total += 1
      buckets.set(slug, bucket)
    }
  }

  buckets.set(EMPTY_GENRE.slug, { ...EMPTY_GENRE })

  return [...buckets.values()].sort((a, b) => {
    const left = FEATURED.indexOf(a.slug)
    const right = FEATURED.indexOf(b.slug)
    const rankA = left === -1 ? FEATURED.length : left
    const rankB = right === -1 ? FEATURED.length : right

    if (rankA !== rankB) {
      return rankA - rankB
    }

    return b.total - a.total || a.name.localeCompare(b.name)
  })
}

function buildCatalog(seeds: SeedShow[] = defaultSeeds()): Catalog {
  const shows = seeds.map(toSummary)
  const details = new Map<number, ShowDetail>()
  const episodes = new Map<number, EpisodeGroup[]>()
  const search = new Map<number, { score: number, summary: string }>()
  const keywords = new Map<number, string[]>()

  seeds.forEach((seed, index) => {
    const groups = toEpisodes(seed)

    episodes.set(seed.id, groups)
    details.set(seed.id, toDetail(seed, groups))
    search.set(seed.id, { score: seed.score ?? 10 - index * 0.01, summary: summaryText(seed) })
    keywords.set(seed.id, seed.keywords ?? [])
  })

  return {
    genres: buildGenres(shows),
    shows,
    spotlight: shows.find((show) => show.id === 1) ?? null,
    details,
    episodes,
    search,
    keywords
  }
}

function defaultSeeds(): SeedShow[] {
  return [...DRAMA,
    ...COMEDY,
    ...SPORTS,
    ...BRE,
    ...EDGE,
    ...fillers()]
}

function tiedSeeds(): SeedShow[] {
  return [...defaultSeeds(), ...TIED]
}

const IDS = {
  nightfall: 1,
  ashfall: 2,
  cinderhouse: 8,
  blackwater: 9,
  roommates: 21,
  fullCount: 31,
  breakwater: 41,
  brightHollow: 43,
  brennerFiles: 45,
  loneMesa: 51,
  longTitle: 71,
  noSeasons: 72
}

const BRE_TITLES = ['Breakwater',
  'The Brennan Line',
  'Bright Hollow',
  'Brimstone County',
  'Brenner Files']

export { IDS, slugify, tiedSeeds, LONG_TITLE, BRE_TITLES, EMPTY_GENRE, buildCatalog, compareShows, defaultSeeds }
