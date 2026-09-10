import type {
  Episode,
  ShowDetail,
  CastMember,
  CrewMember,
  TvmazeShow,
  ShowSummary,
  SeasonSummary,
  TvmazeEpisode,
  TvmazeShowImage
} from '@/models'

const CREATOR_TYPES = ['Creator', 'Co-Creator', 'Developed by']

function stripHtml(value: string | null): string {
  if (!value) {
    return ''
  }

  return value
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, '\'')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function toYear(date: string | null): number | null {
  if (!date) {
    return null
  }

  const year = Number.parseInt(date.slice(0, 4), 10)

  return Number.isNaN(year) ? null : year
}

function toSummary(show: TvmazeShow): ShowSummary {
  return {
    id: show.id,
    name: show.name,
    type: show.type,
    genres: show.genres ?? [],
    year: toYear(show.premiered),
    rating: show.rating?.average ?? null,
    network: show.network?.name ?? show.webChannel?.name ?? null,
    poster: show.image?.medium ?? null,
    backdrop: null,
    posterLarge: show.image?.original ?? show.image?.medium ?? null
  }
}

function toDetail(show: TvmazeShow): ShowDetail {
  const embedded = show._embedded ?? {}
  const seasons: SeasonSummary[] = (embedded.seasons ?? []).map((season) => ({
    id: season.id,
    number: season.number,
    name: season.name,
    year: toYear(season.premiereDate),
    episodeCount: season.episodeOrder ?? 0
  }))

  const cast: CastMember[] = (embedded.cast ?? []).slice(0, 12).map((entry) => ({
    id: entry.person.id,
    person: entry.person.name,
    character: entry.character.name,
    image: entry.person.image?.medium ?? null
  }))

  const crew: CrewMember[] = (embedded.crew ?? []).map((entry) => ({
    id: entry.person.id,
    type: entry.type,
    person: entry.person.name
  }))

  const creators = [...new Set(crew.filter((entry) => CREATOR_TYPES.includes(entry.type)).map((e) => e.person))]

  return {
    ...toSummary(show),
    ended: show.ended,
    status: show.status,
    summary: stripHtml(show.summary),
    language: show.language,
    premiered: show.premiered,
    runtime: show.runtime ?? show.averageRuntime,
    cast,
    crew,
    creators,
    seasons,
    seasonCount: seasons.length,
    episodeCount: seasons.reduce((total, season) => total + season.episodeCount, 0)
  }
}

function pickBackdrop(images: TvmazeShowImage[]): string | null {
  const background = images.filter((image) => image.type === 'background')
  const chosen = background.find((image) => image.main) ?? background[0]

  return chosen?.resolutions.original.url ?? null
}

function toEpisode(episode: TvmazeEpisode): Episode {
  return {
    id: episode.id,
    name: episode.name,
    season: episode.season,
    number: episode.number,
    airdate: episode.airdate,
    runtime: episode.runtime,
    summary: stripHtml(episode.summary),
    rating: episode.rating?.average ?? null,
    image: episode.image?.medium ?? null
  }
}

export { toYear, toDetail, stripHtml, toEpisode, toSummary, pickBackdrop }
