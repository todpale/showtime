import type { ApiErrorBody, RequestParams } from '@/models'

const BASE = '/api/v1'

function toQuery(params: RequestParams): string {
  const search = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== '') {
      search.set(key, String(value))
    }
  }

  const query = search.toString()

  return query ? `?${query}` : ''
}

async function apiGet<T>(path: string, params: RequestParams = {}, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${BASE}${path}${toQuery(params)}`, { signal })

  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as ApiErrorBody

    throw new Error(body.message ?? body.statusText ?? `Request failed with ${response.status}`)
  }

  return await response.json() as T
}

export { apiGet, toQuery }
