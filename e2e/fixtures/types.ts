import type { Episode, ShowDetail, ShowSummary, GenreSummary, EpisodeGroup } from '@/models'

interface SeedShow {
  id: number
  name: string
  year: number
  score?: number
  cast?: string[]
  genres: string[]
  network?: string
  summary?: string
  poster?: boolean
  seasons?: number[]
  keywords?: string[]
  creators?: string[]
  rating: number | null
  runtimes?: Record<string, number>
  episodeNames?: Record<string, string>
}

interface SearchMeta {
  score: number
  summary: string
}

interface Catalog {
  shows: ShowSummary[]
  genres: GenreSummary[]
  spotlight: ShowSummary | null
  search: Map<number, SearchMeta>
  keywords: Map<number, string[]>
  details: Map<number, ShowDetail>
  episodes: Map<number, EpisodeGroup[]>
}

interface Failure {
  status: number
  pattern: RegExp
}

type Latency = (url: URL) => number

export type { Catalog, Episode, Failure, Latency, SeedShow, SearchMeta }
