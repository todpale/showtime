type DetailTab = 'episodes' | 'details' | 'cast' | 'similar'

interface ShowTab {
  label: string
  key: DetailTab
}

interface ShowFact {
  label: string
  value: string
}

interface ShowSummary {
  id: number
  name: string
  genres: string[]
  type: string | null
  year: number | null
  rating: number | null
  poster: string | null
  network: string | null
  backdrop: string | null
  posterLarge: string | null
}

interface CastMember {
  id: number
  person: string
  character: string
  image: string | null
}

interface CrewMember {
  id: number
  type: string
  person: string
}

interface ShowDetail extends ShowSummary {
  summary: string
  cast: CastMember[]
  crew: CrewMember[]
  creators: string[]
  seasonCount: number
  ended: string | null
  episodeCount: number
  status: string | null
  runtime: number | null
  language: string | null
  premiered: string | null
  seasons: SeasonSummary[]
}

interface SeasonSummary {
  id: number
  number: number
  name: string | null
  year: number | null
  episodeCount: number
}

export type { ShowTab, ShowFact, DetailTab, ShowDetail, CastMember, CrewMember, ShowSummary, SeasonSummary }
