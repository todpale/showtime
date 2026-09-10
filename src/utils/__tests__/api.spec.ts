import { apiGet, toQuery } from '@/utils/api'
import { vi, it, expect, describe, afterEach, beforeEach } from 'vitest'

function response(body: unknown, init: { ok?: boolean, status?: number } = {}): Response {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: () => Promise.resolve(body)
  } as unknown as Response
}

function rejectingResponse(status: number): Response {
  return {
    ok: false,
    status,
    json: () => Promise.reject(new Error('not json'))
  } as unknown as Response
}

const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>()

describe('toQuery', () => {
  it('returns an empty string when there is nothing to send', () => {
    expect(toQuery({})).toBe('')
  })

  it('serialises the params it is given', () => {
    expect(toQuery({ q: 'dome', sort: 'rating' })).toBe('?q=dome&sort=rating')
  })

  it('drops null, undefined and empty values', () => {
    expect(toQuery({ q: 'dome', year: null, genre: undefined, sort: '' })).toBe('?q=dome')
  })

  it('keeps a zero value', () => {
    expect(toQuery({ offset: 0 })).toBe('?offset=0')
  })

  it('encodes special characters', () => {
    expect(toQuery({ q: 'tom & jerry' })).toBe('?q=tom+%26+jerry')
  })
})

describe('apiGet', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('requests the versioned api path and returns the parsed body', async () => {
    fetchMock.mockResolvedValue(response({ rows: [] }))

    const result = await apiGet<{ rows: string[] }>('/home')

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/home', { signal: undefined })
    expect(result).toEqual({ rows: [] })
  })

  it('appends the query string built from the params', async () => {
    fetchMock.mockResolvedValue(response([]))

    await apiGet('/genres/drama', { sort: 'rating', offset: 24, year: null })

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/genres/drama?sort=rating&offset=24', { signal: undefined })
  })

  it('forwards the abort signal', async () => {
    fetchMock.mockResolvedValue(response([]))

    const controller = new AbortController()

    await apiGet('/search', { q: 'dome' }, controller.signal)

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/search?q=dome', { signal: controller.signal })
  })

  it('throws the message the server sent when the response fails', async () => {
    fetchMock.mockResolvedValue(response({ message: 'No such show' }, { ok: false, status: 404 }))

    await expect(apiGet('/shows/9999')).rejects.toThrow('No such show')
  })

  it('falls back to the status text when there is no message', async () => {
    fetchMock.mockResolvedValue(response({ statusText: 'Bad Gateway' }, { ok: false, status: 502 }))

    await expect(apiGet('/home')).rejects.toThrow('Bad Gateway')
  })

  it('falls back to the status code when the error body cannot be read', async () => {
    fetchMock.mockResolvedValue(rejectingResponse(500))

    await expect(apiGet('/home')).rejects.toThrow('Request failed with 500')
  })

  it('propagates a network failure', async () => {
    fetchMock.mockRejectedValue(new Error('Network down'))

    await expect(apiGet('/home')).rejects.toThrow('Network down')
  })
})
