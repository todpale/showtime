import { toSummary } from './mappers'
import { fetchShowPage } from './tvmaze'
import { useStorage } from 'nitro/storage'
import type { GenreIndex, GenreBucket, ShowSummary, GenreSummary } from '@/models'

const MAX_AGE_MS = 1000 * 60 * 60 * 24
const INDEX_KEY = 'index'
const PAGES = 16
const BATCH = 4
const FEATURED = ['drama', 'comedy', 'sports']

let building: Promise<GenreIndex> | null = null

function useGenreStorage() {
  return useStorage('genres')
}

function slugify(genre: string): string {
  return genre
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function isStale(value: { fetchedAt: number } | null): boolean {
  return !value || Date.now() - value.fetchedAt > MAX_AGE_MS
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

async function collectShows(): Promise<ShowSummary[]> {
  const shows: ShowSummary[] = []

  for (let page = 0; page < PAGES; page += BATCH) {
    const batch = Array.from({ length: Math.min(BATCH, PAGES - page) }, (_, offset) => page + offset)
    const pages = await Promise.all(batch.map((number) => fetchShowPage(number)))

    for (const entries of pages) {
      for (const show of entries) {
        shows.push(toSummary(show))
      }
    }
  }

  return shows
}

async function build(): Promise<GenreIndex> {
  const storage = useGenreStorage()
  const shows = await collectShows()
  const buckets = new Map<string, { name: string, shows: ShowSummary[] }>()

  for (const show of shows) {
    for (const genre of show.genres) {
      const slug = slugify(genre)

      if (!slug) {
        continue
      }

      const bucket = buckets.get(slug) ?? { name: genre, shows: [] }

      bucket.shows.push(show)
      buckets.set(slug, bucket)
    }
  }

  const fetchedAt = Date.now()
  const genres: GenreSummary[] = []

  for (const [slug, bucket] of buckets) {
    bucket.shows.sort(compareShows)
    genres.push({ name: bucket.name, slug, total: bucket.shows.length })

    await storage.setItem(`shows:${slug}`, {
      slug,
      name: bucket.name,
      total: bucket.shows.length,
      fetchedAt,
      shows: bucket.shows
    } as GenreBucket)
  }

  genres.sort((a, b) => {
    const left = FEATURED.indexOf(a.slug)
    const right = FEATURED.indexOf(b.slug)

    if (left !== right) {
      return (left === -1 ? FEATURED.length : left) - (right === -1 ? FEATURED.length : right)
    }

    return b.total - a.total || a.name.localeCompare(b.name)
  })

  const rated = shows.filter((show) => show.rating !== null && show.posterLarge !== null).sort(compareShows)
  const index: GenreIndex = { fetchedAt, genres, spotlight: rated[0] ?? null }

  await storage.setItem(INDEX_KEY, index)

  return index
}

function rebuild(): Promise<GenreIndex> {
  building ??= build().finally(() => {
    building = null
  })

  return building
}

async function readIndex(): Promise<GenreIndex> {
  const cached = await useGenreStorage().getItem<GenreIndex>(INDEX_KEY)

  if (!cached) {
    return rebuild()
  }

  if (isStale(cached)) {
    rebuild().catch(() => undefined)
  }

  return cached
}

async function readBucket(slug: string): Promise<GenreBucket | null> {
  const storage = useGenreStorage()
  const cached = await storage.getItem<GenreBucket>(`shows:${slug}`)

  if (cached && !isStale(cached)) {
    return cached
  }

  if (cached) {
    rebuild().catch(() => undefined)

    return cached
  }

  const index = await readIndex()

  if (!index.genres.some((genre) => genre.slug === slug)) {
    return null
  }

  const rebuilt = await storage.getItem<GenreBucket>(`shows:${slug}`)

  if (rebuilt) {
    return rebuilt
  }

  await rebuild()

  return storage.getItem<GenreBucket>(`shows:${slug}`)
}

export { isStale, slugify, readIndex, readBucket, compareShows, useGenreStorage }
