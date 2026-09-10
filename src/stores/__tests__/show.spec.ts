import { apiGet } from '@/utils/api'
import { useShowStore } from '@/stores/show'
import { createPinia, setActivePinia } from 'pinia'
import { vi, it, expect, describe, beforeEach } from 'vitest'
import { makeGroup, makeDetail, makeEpisode } from '@/__tests__/fixtures'

vi.mock('@/utils/api', () => ({ apiGet: vi.fn(), toQuery: vi.fn(() => '') }))

const apiGetMock = vi.mocked(apiGet)

const GROUPS = [
  makeGroup(1, [makeEpisode({ id: 10, number: 1 }), makeEpisode({ id: 11, number: 2, name: 'The Fire' })]),
  makeGroup(2, [makeEpisode({ id: 20, season: 2, number: 1, name: 'Heads Will Roll' })])
]

function serveShow(id = 1, groups = GROUPS): void {
  apiGetMock.mockImplementation((path: string) => {
    if (path.endsWith('/episodes')) {
      return Promise.resolve(groups)
    }

    return Promise.resolve(makeDetail({ id }))
  })
}

describe('show store', () => {
  beforeEach(() => {
    apiGetMock.mockReset()
    setActivePinia(createPinia())
  })

  it('starts idle with nothing selected', () => {
    const show = useShowStore()

    expect(show.status).toBe('idle')
    expect(show.detail).toBeNull()
    expect(show.selected).toBeNull()
    expect(show.tab).toBe('episodes')
  })

  it('loads the detail and the episodes of a show', async () => {
    serveShow(42)

    const show = useShowStore()
    const pending = show.open(42)

    expect(show.status).toBe('loading')

    await pending

    expect(show.status).toBe('ready')
    expect(show.detail?.id).toBe(42)
    expect(show.groups).toEqual(GROUPS)
    expect(apiGetMock).toHaveBeenCalledWith('/shows/42')
    expect(apiGetMock).toHaveBeenCalledWith('/shows/42/episodes')
  })

  it('opens on the first available season', async () => {
    serveShow(1, [makeGroup(3, [makeEpisode({ id: 30, season: 3 })])])

    const show = useShowStore()

    await show.open(1)

    expect(show.season).toBe(3)
    expect(show.seasons).toEqual([3])
  })

  it('falls back to season one when a show has no episodes', async () => {
    serveShow(1, [])

    const show = useShowStore()

    await show.open(1)

    expect(show.season).toBe(1)
    expect(show.episodes).toEqual([])
  })

  it('does not refetch a show that is already open', async () => {
    serveShow(1)

    const show = useShowStore()

    await show.open(1)
    await show.open(1)

    expect(apiGetMock).toHaveBeenCalledTimes(2)
  })

  it('loads a different show when the id changes', async () => {
    serveShow(1)

    const show = useShowStore()

    await show.open(1)
    serveShow(2)
    await show.open(2)

    expect(show.detail?.id).toBe(2)
  })

  it('reports an error when the show cannot be loaded', async () => {
    apiGetMock.mockRejectedValue(new Error('No such show'))

    const show = useShowStore()

    await show.open(999)

    expect(show.status).toBe('error')
    expect(show.error).toBe('No such show')
    expect(show.detail).toBeNull()
  })

  it('lists only the episodes of the chosen season', async () => {
    serveShow()

    const show = useShowStore()

    await show.open(1)

    expect(show.episodes.map((episode) => episode.id)).toEqual([10, 11])

    show.setSeason(2)

    expect(show.episodes.map((episode) => episode.id)).toEqual([20])
  })

  it('drops the selected episode when the season changes', async () => {
    serveShow()

    const show = useShowStore()

    await show.open(1)
    show.select(makeEpisode({ id: 11 }))
    show.setSeason(2)

    expect(show.selected).toBeNull()
  })

  it('keeps the chosen episode selected', async () => {
    serveShow()

    const show = useShowStore()

    await show.open(1)
    show.select(makeEpisode({ id: 11, number: 2, name: 'The Fire' }))

    expect(show.selected?.id).toBe(11)

    show.select(null)

    expect(show.selected).toBeNull()
  })

  it('switches the detail tab', async () => {
    serveShow()

    const show = useShowStore()

    await show.open(1)
    show.setTab('details')

    expect(show.tab).toBe('details')
  })

  it('resets the tab and the selection when another show is opened', async () => {
    serveShow(1)

    const show = useShowStore()

    await show.open(1)
    show.select(makeEpisode({ id: 10 }))
    show.setTab('similar')
    serveShow(2)
    await show.open(2)

    expect(show.tab).toBe('episodes')
    expect(show.selected).toBeNull()
  })
})
