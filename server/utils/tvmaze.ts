import { fetch, HTTPError } from 'nitro'
import { defineCachedFunction } from 'nitro/cache'
import type { TvmazeShow, TvmazeEpisode, TvmazeSearchHit, TvmazeShowImage } from '@/models'

const BASE = 'https://api.tvmaze.com'
const HOUR = 60 * 60
const DAY = HOUR * 24

async function request<T>(path: string): Promise<T> {
  let response: Response

  try {
    response = await fetch(`${BASE}${path}`)
  } catch {
    throw HTTPError.status(502, 'Bad Gateway', { message: 'TVmaze is unreachable' })
  }

  if (response.status === 404) {
    throw HTTPError.status(404, 'Not Found', { message: 'No such resource on TVmaze' })
  }

  if (response.status === 429) {
    throw HTTPError.status(503, 'Service Unavailable', { message: 'TVmaze rate limit reached, retry shortly' })
  }

  if (!response.ok) {
    throw HTTPError.status(502, 'Bad Gateway', { message: `TVmaze responded with ${response.status}` })
  }

  return response.json() as Promise<T>
}

const fetchShowPage = defineCachedFunction(
  async (page: number) => {
    try {
      return await request<TvmazeShow[]>(`/shows?page=${page}`)
    } catch (error) {
      if (error instanceof HTTPError && error.status === 404) {
        return []
      }

      throw error
    }
  },
  { name: 'tvmaze-show-index', maxAge: DAY, getKey: (page: number) => String(page) }
)

const fetchShow = defineCachedFunction(
  (id: number) => request<TvmazeShow>(`/shows/${id}?embed[]=cast&embed[]=crew&embed[]=seasons`),
  { name: 'tvmaze-show', maxAge: HOUR, getKey: (id: number) => String(id) }
)

const fetchEpisodes = defineCachedFunction(
  (id: number) => request<TvmazeEpisode[]>(`/shows/${id}/episodes`),
  { name: 'tvmaze-episodes', maxAge: HOUR, getKey: (id: number) => String(id) }
)

const fetchImages = defineCachedFunction(
  async (id: number) => {
    try {
      return await request<TvmazeShowImage[]>(`/shows/${id}/images`)
    } catch {
      return []
    }
  },
  { name: 'tvmaze-images', maxAge: DAY, getKey: (id: number) => String(id) }
)

const fetchSearch = defineCachedFunction(
  (query: string) => request<TvmazeSearchHit[]>(`/search/shows?q=${encodeURIComponent(query)}`),
  { name: 'tvmaze-search', maxAge: HOUR, getKey: (query: string) => query.toLowerCase() }
)

export { fetchShow, fetchImages, fetchSearch, fetchShowPage, fetchEpisodes }
