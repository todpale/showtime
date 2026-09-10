interface Episode {
  id: number
  name: string
  season: number
  summary: string
  image: string | null
  number: number | null
  rating: number | null
  airdate: string | null
  runtime: number | null
}

interface EpisodeGroup {
  season: number
  episodes: Episode[]
}

export type { Episode, EpisodeGroup }
