import type { GenrePage } from '@/models'
import { HTTPError, defineHandler } from 'nitro'
import { getQuery, getRouterParam } from 'nitro/h3'
import { slugify, readBucket } from '~/utils/genres'
import { toSort, toNumber, yearFacet, toFilters, sortShows, applyFilters } from '~/utils/catalog'

const DEFAULT_LIMIT = 24

export default defineHandler(async (event): Promise<GenrePage> => {
  const param = getRouterParam(event, 'genre')

  if (!param) {
    throw HTTPError.status(400, 'Bad Request', { message: 'Missing genre' })
  }

  const bucket = await readBucket(slugify(param))

  if (!bucket) {
    throw HTTPError.status(404, 'Not Found', { message: `Unknown genre "${param}"` })
  }

  const query = getQuery(event) as Record<string, unknown>
  const filters = toFilters(query)
  const filtered = applyFilters(bucket.shows, filters)
  const sorted = sortShows(filtered, toSort(query.sort))
  const offset = Math.max(toNumber(query.offset) ?? 0, 0)
  const limit = Math.min(Math.max(toNumber(query.limit) ?? DEFAULT_LIMIT, 1), 100)

  return {
    name: bucket.name,
    slug: bucket.slug,
    total: bucket.total,
    matched: sorted.length,
    years: yearFacet(bucket.shows, filters),
    shows: sorted.slice(offset, offset + limit)
  }
})
