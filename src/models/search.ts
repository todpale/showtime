import type { ShowSummary } from './show'

interface SearchResult extends ShowSummary {
  score: number
  summary: string
  seasonCount: number | null
}

interface SearchResponse {
  query: string
  total: number
  results: SearchResult[]
}

export type { SearchResult, SearchResponse }
