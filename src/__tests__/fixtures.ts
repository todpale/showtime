import type { Episode, ShowDetail, ShowSummary, SearchResult, EpisodeGroup } from '@/models'

function makeShow(overrides: Partial<ShowSummary> = {}): ShowSummary {
  return {
    id: 1,
    name: 'Under the Dome',
    genres: ['Drama', 'Science-Fiction'],
    type: 'Scripted',
    year: 2013,
    rating: 6.5,
    poster: 'https://img/poster.jpg',
    network: 'CBS',
    backdrop: null,
    posterLarge: 'https://img/poster-large.jpg',
    ...overrides
  }
}

function makeDetail(overrides: Partial<ShowDetail> = {}): ShowDetail {
  return {
    ...makeShow(),
    summary: 'A small town is sealed off by a dome.',
    cast: [],
    crew: [],
    creators: ['Brian K. Vaughan'],
    seasonCount: 1,
    ended: null,
    episodeCount: 13,
    status: 'Ended',
    runtime: 60,
    language: 'English',
    premiered: '2013-06-24',
    seasons: [],
    ...overrides
  }
}

function makeEpisode(overrides: Partial<Episode> = {}): Episode {
  return {
    id: 10,
    name: 'Pilot',
    season: 1,
    summary: 'The dome comes down.',
    image: 'https://img/still.jpg',
    number: 1,
    rating: 7.8,
    airdate: '2013-06-24',
    runtime: 60,
    ...overrides
  }
}

function makeGroup(season: number, episodes: Episode[]): EpisodeGroup {
  return { season, episodes }
}

function makeResult(overrides: Partial<SearchResult> = {}): SearchResult {
  return {
    ...makeShow(),
    score: 12.5,
    summary: 'A small town is sealed off by a dome.',
    seasonCount: 3,
    ...overrides
  }
}

export { makeShow, makeGroup, makeDetail, makeResult, makeEpisode }
