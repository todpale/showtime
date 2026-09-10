import { apiGet } from '@/utils/api'
import type { SearchResponse } from '@/models'
import { useSearchStore } from '@/stores/search'
import { makeResult } from '@/__tests__/fixtures'
import { createPinia, setActivePinia } from 'pinia'
import { vi, it, expect, describe, afterEach, beforeEach } from 'vitest'

vi.mock('@/utils/api', () => ({ apiGet: vi.fn(), toQuery: vi.fn(() => '') }))

const apiGetMock = vi.mocked(apiGet)
const RECENT_KEY = 'showtime.recent-searches'

function makeResponse(query: string, ids: number[]): SearchResponse {
  return {
    query,
    total: ids.length,
    results: ids.map((id) => makeResult({ id, name: `Show ${id}` }))
  }
}

function lastParams(): Record<string, unknown> {
  const calls = apiGetMock.mock.calls

  return (calls[calls.length - 1]?.[1] ?? {}) as Record<string, unknown>
}

function readRecent(): string[] {
  return JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? '[]') as string[]
}

describe('search store', () => {
  beforeEach(() => {
    apiGetMock.mockReset()
    window.localStorage.clear()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts idle with no query', () => {
    const search = useSearchStore()

    expect(search.status).toBe('idle')
    expect(search.hasQuery).toBe(false)
    expect(search.results).toEqual([])
    expect(search.topResult).toBeNull()
  })

  it('waits for typing to settle before searching', async () => {
    vi.useFakeTimers()
    apiGetMock.mockResolvedValue(makeResponse('dome', [1]))

    const search = useSearchStore()

    search.setQuery('do')
    await vi.advanceTimersByTimeAsync(200)

    expect(apiGetMock).not.toHaveBeenCalled()

    search.setQuery('dome')
    await vi.advanceTimersByTimeAsync(200)

    expect(apiGetMock).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(50)

    expect(apiGetMock).toHaveBeenCalledTimes(1)
    expect(lastParams().q).toBe('dome')
    expect(search.results.map((result) => result.id)).toEqual([1])
  })

  it('searches immediately when the query is submitted', async () => {
    apiGetMock.mockResolvedValue(makeResponse('dome', [1, 2]))

    const search = useSearchStore()

    await search.submit('dome')

    expect(search.status).toBe('ready')
    expect(search.submitted).toBe('dome')
    expect(search.results).toHaveLength(2)
  })

  it('cancels a pending debounce when the query is submitted', async () => {
    vi.useFakeTimers()
    apiGetMock.mockResolvedValue(makeResponse('dome', [1]))

    const search = useSearchStore()

    search.setQuery('dom')
    await search.submit('dome')
    await vi.advanceTimersByTimeAsync(500)

    expect(apiGetMock).toHaveBeenCalledTimes(1)
  })

  it('splits the results into a top result and the rest', async () => {
    apiGetMock.mockResolvedValue(makeResponse('dome', [1, 2, 3]))

    const search = useSearchStore()

    await search.submit('dome')

    expect(search.topResult?.id).toBe(1)
    expect(search.restResults.map((result) => result.id)).toEqual([2, 3])
  })

  it('does not search for a blank query', async () => {
    const search = useSearchStore()

    await search.submit('   ')

    expect(apiGetMock).not.toHaveBeenCalled()
    expect(search.status).toBe('idle')
    expect(search.results).toEqual([])
  })

  it('reports an error when the search fails', async () => {
    apiGetMock.mockRejectedValue(new Error('TVmaze rate limit reached, retry shortly'))

    const search = useSearchStore()

    await search.submit('dome')

    expect(search.status).toBe('error')
    expect(search.error).toBe('TVmaze rate limit reached, retry shortly')
  })

  it('keeps the newest results when an earlier request answers last', async () => {
    let releaseFirst = (): void => undefined

    apiGetMock.mockImplementationOnce(() => new Promise((resolve) => {
      releaseFirst = () => resolve(makeResponse('do', [99]))
    }))
    apiGetMock.mockImplementationOnce(() => Promise.resolve(makeResponse('dome', [1, 2])))

    const search = useSearchStore()
    const stale = search.submit('do')

    await search.submit('dome')

    releaseFirst()
    await stale

    expect(search.submitted).toBe('dome')
    expect(search.results.map((result) => result.id)).toEqual([1, 2])
    expect(search.status).toBe('ready')
  })

  it('ignores the failure of a request that has been superseded', async () => {
    let rejectFirst = (): void => undefined

    apiGetMock.mockImplementationOnce(() => new Promise((resolve, reject) => {
      rejectFirst = () => reject(new Error('Aborted'))
    }))
    apiGetMock.mockImplementationOnce(() => Promise.resolve(makeResponse('dome', [1])))

    const search = useSearchStore()
    const stale = search.submit('do')

    await search.submit('dome')

    rejectFirst()
    await stale

    expect(search.status).toBe('ready')
    expect(search.error).toBeNull()
  })

  it('clears the query, the results and any pending search', async () => {
    vi.useFakeTimers()
    apiGetMock.mockResolvedValue(makeResponse('dome', [1]))

    const search = useSearchStore()

    await search.submit('dome')
    search.setQuery('other')
    search.clearQuery()
    await vi.advanceTimersByTimeAsync(500)

    expect(search.query).toBe('')
    expect(search.submitted).toBe('')
    expect(search.results).toEqual([])
    expect(search.status).toBe('idle')
    expect(apiGetMock).toHaveBeenCalledTimes(1)
  })

  it('remembers the queries that were searched', async () => {
    apiGetMock.mockImplementation((path: string, params?: Record<string, unknown>) => {
      const term = String(params?.q ?? '')

      return Promise.resolve(makeResponse(term, [1]))
    })

    const search = useSearchStore()

    await search.submit('dome')
    await search.submit('lost')

    expect(search.recent).toEqual(['lost', 'dome'])
    expect(readRecent()).toEqual(['lost', 'dome'])
  })

  it('moves a repeated query back to the front instead of duplicating it', async () => {
    apiGetMock.mockImplementation((path: string, params?: Record<string, unknown>) => {
      const term = String(params?.q ?? '')

      return Promise.resolve(makeResponse(term, [1]))
    })

    const search = useSearchStore()

    await search.submit('dome')
    await search.submit('lost')
    await search.submit('dome')

    expect(search.recent).toEqual(['dome', 'lost'])
  })

  it('keeps at most eight recent searches', async () => {
    apiGetMock.mockImplementation((path: string, params?: Record<string, unknown>) => {
      const term = String(params?.q ?? '')

      return Promise.resolve(makeResponse(term, [1]))
    })

    const search = useSearchStore()

    for (const index of [1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9]) {
      await search.submit(`show ${index}`)
    }

    expect(search.recent).toHaveLength(8)
    expect(search.recent[0]).toBe('show 9')
    expect(search.recent).not.toContain('show 1')
  })

  it('restores the recent searches of a previous session', () => {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(['dome']))

    expect(useSearchStore().recent).toEqual(['dome'])
  })

  it('forgets a single recent search', () => {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(['dome', 'lost']))

    const search = useSearchStore()

    search.forgetQuery('dome')

    expect(search.recent).toEqual(['lost'])
    expect(readRecent()).toEqual(['lost'])
  })

  it('clears every recent search', () => {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(['dome', 'lost']))

    const search = useSearchStore()

    search.clearRecent()

    expect(search.recent).toEqual([])
    expect(readRecent()).toEqual([])
  })

  it('re-runs the search when the sort changes', async () => {
    apiGetMock.mockResolvedValue(makeResponse('dome', [1]))

    const search = useSearchStore()

    await search.submit('dome')
    await search.setSort('rating')

    expect(search.sort).toBe('rating')
    expect(lastParams().sort).toBe('rating')
  })

  it('re-runs the search with the filters applied', async () => {
    apiGetMock.mockResolvedValue(makeResponse('dome', [1]))

    const search = useSearchStore()

    await search.submit('dome')
    await search.setFilters({ genre: 'drama', minRating: 8 })

    expect(search.filters).toEqual({ year: null, genre: 'drama', minRating: 8 })
    expect(lastParams()).toMatchObject({ genre: 'drama', minRating: 8, q: 'dome' })
  })
})
