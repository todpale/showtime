import { createPinia } from 'pinia'
import { apiGet } from '@/utils/api'
import ShowView from '@/views/ShowView.vue'
import { useListStore } from '@/stores/list'
import type { DOMWrapper } from '@vue/test-utils'
import { mount, flushPromises } from '@vue/test-utils'
import type { ShowFact, GenrePage, ShowDetail } from '@/models'
import { vi, it, expect, describe, afterEach, beforeEach } from 'vitest'
import { makeShow, makeGroup, makeDetail, makeEpisode } from '@/__tests__/fixtures'
import { testPlugins, stubMatchMedia, createTestRouter } from '@/__tests__/setup.ts'

vi.mock('@/utils/api', () => ({ apiGet: vi.fn(), toQuery: vi.fn(() => '') }))

const apiGetMock = vi.mocked(apiGet)

const GROUPS = [
  makeGroup(1, [
    makeEpisode({ id: 10, number: 1, name: 'Pilot' }),
    makeEpisode({ id: 11, number: 2, name: 'The Fire' })
  ]),
  makeGroup(2, [makeEpisode({ id: 20, season: 2, number: 1, name: 'Heads Will Roll' })])
]

const SIMILAR: GenrePage = {
  name: 'Drama',
  slug: 'drama',
  total: 2,
  matched: 2,
  years: [2013],
  shows: [makeShow({ id: 1 }), makeShow({ id: 99, name: 'Fringe' })]
}

function serve(detail: ShowDetail | Error = makeDetail({ id: 1 })): void {
  apiGetMock.mockImplementation((path: string) => {
    if (path.endsWith('/episodes')) {
      return Promise.resolve(GROUPS)
    }

    if (path.startsWith('/genres/')) {
      return Promise.resolve(SIMILAR)
    }

    return detail instanceof Error ? Promise.reject(detail) : Promise.resolve(detail)
  })
}

async function mountView(id = 1) {
  const pinia = createPinia()
  const router = createTestRouter()

  await router.push(`/shows/${id}`)
  await router.isReady()

  const wrapper = mount(ShowView, { global: { plugins: testPlugins(pinia, router) } })

  await flushPromises()

  return { pinia, router, wrapper }
}

function readFacts(rows: DOMWrapper<Element>[]): ShowFact[] {
  return rows.map((row) => ({
    label: row.get('[data-test="detail-fact-label"]').text(),
    value: row.get('[data-test="detail-fact-value"]').text()
  }))
}

async function factsOf(detail: ShowDetail): Promise<ShowFact[]> {
  serve(detail)

  const { wrapper } = await mountView()

  await wrapper.get('[data-test="detail-tab-details"]').trigger('click')

  return readFacts(wrapper.findAll('[data-test="detail-fact"]'))
}

describe('ShowView', () => {
  beforeEach(() => {
    apiGetMock.mockReset()
    window.localStorage.clear()
    stubMatchMedia(false)
    serve()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads the show named in the url', async () => {
    await mountView(42)

    expect(apiGetMock).toHaveBeenCalledWith('/shows/42')
    expect(apiGetMock).toHaveBeenCalledWith('/shows/42/episodes')
  })

  it('shows the hero of the show', async () => {
    const { wrapper } = await mountView()

    expect(wrapper.get('[data-test="detail-title"]').text()).toBe('Under the Dome')
    expect(wrapper.get('[data-test="detail-summary"]').text()).toContain('sealed off by a dome')
  })

  it('reports a failure and offers to try again', async () => {
    serve(new Error('No such show'))

    const { wrapper } = await mountView(999)

    expect(wrapper.get('[data-test="show-error"]').text()).toContain('No such show')

    serve()
    await wrapper.get('[data-test="state-retry-btn"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="detail-title"]').exists()).toBe(true)
  })

  it('opens on the episodes of the first season', async () => {
    const { wrapper } = await mountView()

    expect(wrapper.get('[data-test="detail-episodes"]').text()).toContain('Pilot')
    expect(wrapper.get('[data-test="detail-episode-count"]').text()).toBe('2 episodes')
  })

  it('switches to another season', async () => {
    const { wrapper } = await mountView()

    await wrapper.get('[data-test="detail-season-select"]').setValue('2')

    expect(wrapper.get('[data-test="detail-episodes"]').text()).toContain('Heads Will Roll')
    expect(wrapper.get('[data-test="detail-episodes"]').text()).not.toContain('Pilot')
  })

  it('keeps the episode modal closed until an episode is picked', async () => {
    const { wrapper } = await mountView()

    expect(wrapper.find('[data-test="episode-modal"]').exists()).toBe(false)
  })

  it('opens an episode in a modal and closes it again', async () => {
    const { wrapper } = await mountView()

    await wrapper.get('[data-test="episode-card-2"]').trigger('click')

    const modal = wrapper.get('[data-test="episode-modal"]')

    expect(modal.text()).toContain('The Fire')
    expect(modal.get('[data-test="episode-modal-title"]').text()).toBe('The Fire')

    await wrapper.get('[data-test="episode-modal-close-btn"]').trigger('click')

    expect(wrapper.find('[data-test="episode-modal"]').exists()).toBe(false)
  })

  it('closes the episode modal from the scrim behind it', async () => {
    const { wrapper } = await mountView()

    await wrapper.get('[data-test="episode-card-1"]').trigger('click')

    expect(wrapper.get('[data-test="episode-modal-title"]').text()).toBe('Pilot')

    await wrapper.get('[data-test="episode-modal-scrim-btn"]').trigger('click')

    expect(wrapper.find('[data-test="episode-modal"]').exists()).toBe(false)
  })

  it('adds the show to my list and takes it out again', async () => {
    const { wrapper, pinia } = await mountView()

    await wrapper.get('[data-test="detail-add-btn"]').trigger('click')

    expect(useListStore(pinia).has(1)).toBe(true)

    await wrapper.get('[data-test="detail-add-btn"]').trigger('click')

    expect(useListStore(pinia).has(1)).toBe(false)
  })

  it('shows the facts of the show under the details tab', async () => {
    const { wrapper } = await mountView()

    await wrapper.get('[data-test="detail-tab-details"]').trigger('click')

    const details = wrapper.get('[data-test="detail-details"]')

    expect(details.text()).toContain('2013-06-24')
    expect(details.text()).toContain('Drama, Science-Fiction')
    expect(details.text()).toContain('Ended')
    expect(wrapper.find('[data-test="detail-episodes"]').exists()).toBe(false)
  })

  it('names every fact under the details tab', async () => {
    const { wrapper } = await mountView()

    await wrapper.get('[data-test="detail-tab-details"]').trigger('click')

    expect(readFacts(wrapper.findAll('[data-test="detail-fact"]'))).toEqual([
      { label: 'Premiered', value: '2013-06-24' },
      { label: 'Genres', value: 'Drama, Science-Fiction' },
      { label: 'Status', value: 'Ended' },
      { label: 'Network', value: 'CBS' }
    ])
  })

  it('names the network of the show as the last fact', async () => {
    const facts = await factsOf(makeDetail({ id: 1, network: 'AMC', language: 'English' }))

    expect(facts[3]).toEqual({ label: 'Network', value: 'AMC' })
  })

  it('falls back to the language when the show has no network', async () => {
    const facts = await factsOf(makeDetail({ id: 1, network: null, language: 'Japanese' }))

    expect(facts[3]).toEqual({ label: 'Language', value: 'Japanese' })
  })

  it('asks for the language of a show that has neither a network nor a language', async () => {
    const facts = await factsOf(makeDetail({ id: 1, network: null, language: null }))

    expect(facts[3]).toEqual({ label: 'Language', value: '—' })
  })

  it('keeps the labels and writes a dash for the facts a show does not report', async () => {
    const facts = await factsOf(makeDetail({ id: 1, premiered: null, genres: [], status: null, network: null }))

    expect(facts).toEqual([
      { label: 'Premiered', value: '—' },
      { label: 'Genres', value: '—' },
      { label: 'Status', value: '—' },
      { label: 'Language', value: 'English' }
    ])
  })

  it('lists the cast under the cast tab', async () => {
    serve(makeDetail({ id: 1, cast: [{ id: 3, person: 'Mike Vogel', character: 'Dale Barbara', image: null }] }))

    const { wrapper } = await mountView()

    await wrapper.get('[data-test="detail-tab-cast"]').trigger('click')

    expect(wrapper.get('[data-test="detail-cast"]').text()).toContain('Mike Vogel')
    expect(wrapper.get('[data-test="detail-cast"]').text()).toContain('Dale Barbara')
  })

  it('suggests other shows of the same genre, never the show itself', async () => {
    const { wrapper } = await mountView()

    await wrapper.get('[data-test="detail-tab-similar"]').trigger('click')

    expect(apiGetMock).toHaveBeenCalledWith('/genres/drama', { limit: 12 })
    expect(wrapper.get('[data-test="detail-similar"]').text()).toContain('Fringe')
    expect(wrapper.find('[data-test="show-card-1"]').exists()).toBe(false)
  })

  it('says when there is nothing similar to suggest', async () => {
    serve(makeDetail({ id: 1, genres: [] }))

    const { wrapper } = await mountView()

    await wrapper.get('[data-test="detail-tab-similar"]').trigger('click')

    expect(wrapper.find('[data-test="detail-similar-empty"]').exists()).toBe(true)
  })

  it('says when a show has no episodes listed', async () => {
    apiGetMock.mockImplementation((path: string) => {
      if (path.endsWith('/episodes')) {
        return Promise.resolve([])
      }

      if (path.startsWith('/genres/')) {
        return Promise.resolve(SIMILAR)
      }

      return Promise.resolve(makeDetail({ id: 1 }))
    })

    const { wrapper } = await mountView()

    expect(wrapper.get('[data-test="detail-episodes-empty"]').text()).toContain('No episodes are listed')
  })

  it('repeats the synopsis under the hero on a phone only', async () => {
    const phone = await mountView()

    expect(phone.wrapper.get('[data-test="detail-synopsis"]').text()).toContain('sealed off by a dome')

    stubMatchMedia(true)

    const desktop = await mountView()

    expect(desktop.wrapper.find('[data-test="detail-synopsis"]').exists()).toBe(false)
  })

  it('goes home from the back button when there is nowhere to go back to', async () => {
    const { wrapper, router } = await mountView()
    const push = vi.spyOn(router, 'push')

    window.history.replaceState(null, '')
    await wrapper.get('[data-test="detail-back-btn"]').trigger('click')

    expect(push).toHaveBeenCalledWith({ name: 'home' })
  })

  it('returns to the previous page from the back button', async () => {
    const { wrapper, router } = await mountView()
    const back = vi.spyOn(router, 'back')

    window.history.replaceState({ back: '/' }, '')
    await wrapper.get('[data-test="detail-back-btn"]').trigger('click')

    expect(back).toHaveBeenCalledTimes(1)

    window.history.replaceState(null, '')
  })

  it('copies the address of the show when it is shared', async () => {
    const writeText = vi.fn()

    vi.stubGlobal('navigator', { clipboard: { writeText } })

    const { wrapper } = await mountView()

    await wrapper.get('[data-test="detail-share-btn"]').trigger('click')

    expect(writeText).toHaveBeenCalledWith(window.location.href)
  })

  it('loads the new show when the url changes', async () => {
    const { wrapper, router } = await mountView(1)

    serve(makeDetail({ id: 2, name: 'Person of Interest' }))
    await router.push('/shows/2')
    await flushPromises()

    expect(wrapper.get('[data-test="detail-title"]').text()).toBe('Person of Interest')
  })
})
