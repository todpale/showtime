import type { ShowSummary } from './show'

interface GenreSummary {
  name: string
  slug: string
  total: number
}

interface GenreIndex {
  fetchedAt: number
  genres: GenreSummary[]
  spotlight: ShowSummary | null
}

interface GenreBucket {
  name: string
  slug: string
  total: number
  fetchedAt: number
  shows: ShowSummary[]
}

interface GenreRow {
  name: string
  slug: string
  total: number
  shows: ShowSummary[]
}

interface GenrePage {
  name: string
  slug: string
  total: number
  matched: number
  years: number[]
  shows: ShowSummary[]
}

interface HomeFeed {
  rows: GenreRow[]
  spotlight: ShowSummary | null
}

export type { GenreRow, HomeFeed, GenrePage, GenreIndex, GenreBucket, GenreSummary }
