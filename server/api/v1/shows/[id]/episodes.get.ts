import { getRouterParam } from 'nitro/h3'
import { toEpisode } from '~/utils/mappers'
import type { EpisodeGroup } from '@/models'
import { fetchEpisodes } from '~/utils/tvmaze'
import { HTTPError, defineHandler } from 'nitro'

export default defineHandler(async (event): Promise<EpisodeGroup[]> => {
  const id = getRouterParam(event, 'id')

  if (!id || !/^\d+$/.test(id)) {
    throw HTTPError.status(400, 'Bad Request', { message: 'Invalid show id' })
  }

  const episodes = (await fetchEpisodes(Number(id))).map(toEpisode)
  const groups = new Map<number, EpisodeGroup>()

  for (const episode of episodes) {
    const group = groups.get(episode.season) ?? { season: episode.season, episodes: [] }

    group.episodes.push(episode)
    groups.set(episode.season, group)
  }

  return [...groups.values()]
    .sort((a, b) => a.season - b.season)
    .map((group) => ({
      season: group.season,
      episodes: group.episodes.sort((a, b) => (a.number ?? 0) - (b.number ?? 0))
    }))
})
