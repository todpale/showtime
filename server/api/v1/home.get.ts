import { getQuery } from 'nitro/h3'
import { defineHandler } from 'nitro'
import { fetchImages } from '~/utils/tvmaze'
import { pickBackdrop } from '~/utils/mappers'
import type { GenreRow, HomeFeed } from '@/models'
import { readIndex, readBucket } from '~/utils/genres'
import { toNumber, toFilters, applyFilters } from '~/utils/catalog'

const DEFAULT_ROWS = 8
const DEFAULT_PER_ROW = 12

export default defineHandler(async (event): Promise<HomeFeed> => {
  const query = getQuery(event) as Record<string, unknown>
  const index = await readIndex()
  const filters = toFilters(query)
  const perRow = Math.min(Math.max(toNumber(query.limit) ?? DEFAULT_PER_ROW, 1), 40)
  const maxRows = Math.min(Math.max(toNumber(query.rows) ?? DEFAULT_ROWS, 1), 20)

  const wanted = filters.genre
    ? index.genres.filter((genre) => genre.slug === filters.genre)
    : index.genres.slice(0, maxRows)

  const rows: GenreRow[] = []

  for (const genre of wanted) {
    const bucket = await readBucket(genre.slug)

    if (!bucket) {
      continue
    }

    const shows = applyFilters(bucket.shows, filters)

    if (shows.length === 0) {
      continue
    }

    rows.push({ name: bucket.name, slug: bucket.slug, total: shows.length, shows: shows.slice(0, perRow) })
  }

  const spotlight = index.spotlight
    ? { ...index.spotlight, backdrop: pickBackdrop(await fetchImages(index.spotlight.id)) }
    : null

  return { rows, spotlight }
})
