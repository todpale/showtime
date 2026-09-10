import { getQuery } from 'nitro/h3'
import { defineHandler } from 'nitro'
import { fetchSearch } from '~/utils/tvmaze'
import { toSummary, stripHtml } from '~/utils/mappers'
import type { SearchResult, SearchResponse } from '@/models'
import { toSort, toFilters, sortShows, applyFilters } from '~/utils/catalog'

export default defineHandler(async (event): Promise<SearchResponse> => {
  const query = getQuery(event) as Record<string, unknown>
  const term = typeof query.q === 'string' ? query.q.trim() : ''

  if (!term) {
    return { query: '', total: 0, results: [] }
  }

  const hits = await fetchSearch(term)
  const results: SearchResult[] = hits.map((hit) => ({
    ...toSummary(hit.show),
    score: hit.score,
    summary: stripHtml(hit.show.summary),
    seasonCount: null
  }))

  const filtered = applyFilters(results, toFilters(query))
  const sorted = sortShows(filtered, toSort(query.sort, 'relevance'))

  return { query: term, total: sorted.length, results: sorted }
})
