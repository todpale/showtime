interface TvmazeImage {
  medium: string
  original: string
}

interface TvmazeRating {
  average: number | null
}

interface TvmazeCountry {
  code: string
  name: string
  timezone: string
}

interface TvmazeNetwork {
  id: number
  name: string
  country: TvmazeCountry | null
}

interface TvmazePerson {
  id: number
  name: string
  image: TvmazeImage | null
}

interface TvmazeCharacter {
  id: number
  name: string
  image: TvmazeImage | null
}

interface TvmazeCast {
  self: boolean
  voice: boolean
  person: TvmazePerson
  character: TvmazeCharacter
}

interface TvmazeCrew {
  type: string
  person: TvmazePerson
}

interface TvmazeSeason {
  id: number
  number: number
  name: string | null
  endDate: string | null
  image: TvmazeImage | null
  premiereDate: string | null
  episodeOrder: number | null
}

interface TvmazeEpisode {
  id: number
  name: string
  season: number
  type: string | null
  rating: TvmazeRating
  number: number | null
  airdate: string | null
  runtime: number | null
  summary: string | null
  airstamp: string | null
  image: TvmazeImage | null
}

interface TvmazeShowEmbedded {
  cast?: TvmazeCast[]
  crew?: TvmazeCrew[]
  seasons?: TvmazeSeason[]
  episodes?: TvmazeEpisode[]
}

interface TvmazeShow {
  id: number
  name: string
  genres: string[]
  type: string | null
  ended: string | null
  rating: TvmazeRating
  status: string | null
  runtime: number | null
  summary: string | null
  language: string | null
  premiered: string | null
  image: TvmazeImage | null
  officialSite: string | null
  averageRuntime: number | null
  network: TvmazeNetwork | null
  _embedded?: TvmazeShowEmbedded
  webChannel: TvmazeNetwork | null
}

interface TvmazeResolution {
  url: string
  width: number
  height: number
}

interface TvmazeShowImage {
  id: number
  main: boolean
  type: string | null
  resolutions: { medium?: TvmazeResolution, original: TvmazeResolution }
}

interface TvmazeSearchHit {
  score: number
  show: TvmazeShow
}

export type {
  TvmazeCast,
  TvmazeCrew,
  TvmazeShow,
  TvmazeImage,
  TvmazePerson,
  TvmazeRating,
  TvmazeSeason,
  TvmazeNetwork,
  TvmazeCountry,
  TvmazeEpisode,
  TvmazeCharacter,
  TvmazeSearchHit,
  TvmazeShowImage,
  TvmazeResolution,
  TvmazeShowEmbedded
}
