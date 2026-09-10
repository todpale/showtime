import { createPinia } from 'pinia'
import { apiGet } from '@/utils/api'
import SearchView from '@/views/SearchView.vue'
import { useSearchStore } from '@/stores/search'
import { mount, flushPromises } from '@vue/test-utils'
import type { HomeFeed, SearchResponse } from '@/models'
import { makeShow, makeResult } from '@/__tests__/fixtures'
import { vi, it, expect, describe, afterEach, beforeEach } from 'vitest'
import { testPlugins, stubMatchMedia, createTestRouter } from '@/__tests__/setup.ts'

vi.mock('@/utils/api', () => ({ apiGet: vi.fn(), toQuery: vi.fn(() => '') }))

const apiGetMock = vi.mocked(apiGet)

const GENRES = [{ name: 'Drama', slug: 'drama', total: 120 }]

const FEED: HomeFeed = {
  rows: [{ name: 'Drama', slug: 'drama', total: 1, shows: [makeShow({ id: 5, name: 'Fringe' })] }],
  spotlight: null
}

function serve(search: SearchResponse | Error): void {
  apiGetMock.mockImplementation((path: string) => {
    if (path === '/genres') {
      return Promise.resolve(GENRES)
    }

    if (path === '/home') {
      return Promise.resolve(FEED)
    }

    return search instanceof Error ? Promise.reject(search) : Promise.resolve(search)
  })
}

function makeResponse(query: string, ids: number[]): SearchResponse {
  return {
    query,
    total: ids.length,
    results: ids.map((id) => makeResult({ id, name: `Show ${id}` }))
  }
}

async function mountView(path = '/search') {
  const pinia = createPinia()
  const router = createTestRouter()

  await router.push(path)
  await router.isReady()

  const wrapper = mount(SearchView, { global: { plugins: testPlugins(pinia, router) } })

  await flushPromises()

  return { pinia, router, wrapper }
}

describe('SearchView', () => {
  beforeEach(() => {
    apiGetMock.mockReset()
    window.localStorage.clear()
    stubMatchMedia(false)
    serve(makeResponse('dome', [1, 2, 3]))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('runs the query that the url carries', async () => {
    const { wrapper, pinia } = await mountView('/search?q=dome')

    expect(useSearchStore(pinia).submitted).toBe('dome')
    expect(wrapper.get('[data-test="search-count"]').text()).toBe('3 results for “dome”')
  })

  it('leads with the best match and lists the rest', async () => {
    const { wrapper } = await mountView('/search?q=dome')

    expect(wrapper.get('[data-test="search-top-result"]').text()).toContain('Show 1')
    expect(wrapper.get('[data-test="search-result-row-1"]').text()).toContain('Show 2')
    expect(wrapper.get('[data-test="search-result-row-2"]').text()).toContain('Show 3')
  })

  it('says when nothing matches', async () => {
    serve(makeResponse('zzz', []))

    const { wrapper } = await mountView('/search?q=zzz')

    expect(wrapper.get('[data-test="search-empty"]').text()).toContain('Nothing matches “zzz”')
  })

  it('reports a failure and offers to try again', async () => {
    serve(new Error('TVmaze is unreachable'))

    const { wrapper } = await mountView('/search?q=dome')

    expect(wrapper.get('[data-test="search-error"]').text()).toContain('TVmaze is unreachable')

    serve(makeResponse('dome', [1]))
    await wrapper.get('[data-test="state-retry-btn"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="search-error"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="search-top-result"]').exists()).toBe(true)
  })

  it('shows nothing but the field until something is typed', async () => {
    const { wrapper } = await mountView()

    expect(wrapper.find('[data-test="search-count"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="search-top-result"]').exists()).toBe(false)
  })

  it('keeps the url in step with what is typed', async () => {
    vi.useFakeTimers()

    const { wrapper, router, pinia } = await mountView()

    await wrapper.get('[data-test="search-input"]').setValue('dome')

    expect(useSearchStore(pinia).query).toBe('dome')

    await vi.advanceTimersByTimeAsync(300)

    expect(router.currentRoute.value.query.q).toBe('dome')
    expect(useSearchStore(pinia).submitted).toBe('dome')

    vi.useRealTimers()
  })

  it('clears the query, the results and the url', async () => {
    const { wrapper, router, pinia } = await mountView('/search?q=dome')

    await wrapper.get('[data-test="search-clear-btn"]').trigger('click')
    await flushPromises()

    expect(useSearchStore(pinia).query).toBe('')
    expect(wrapper.find('[data-test="search-top-result"]').exists()).toBe(false)
    expect(router.currentRoute.value.query.q).toBeUndefined()
  })

  it('searches again from a recent query on a phone', async () => {
    const { wrapper, pinia } = await mountView('/search?q=dome')

    await wrapper.get('[data-test="search-clear-btn"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-test="recent-searches"]').text()).toContain('dome')

    serve(makeResponse('dome', [7]))
    await wrapper.get('[data-test="recent-search-pill-0"]').get('.recent__label').trigger('click')
    await flushPromises()

    expect(useSearchStore(pinia).submitted).toBe('dome')
    expect(wrapper.get('[data-test="search-top-result"]').text()).toContain('Show 7')
  })

  it('offers a way back on a phone but not the sidebar', async () => {
    const { wrapper } = await mountView()

    expect(wrapper.find('[data-test="search-back-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="search-sidebar"]').exists()).toBe(false)
  })

  it('shows the sidebar and an invitation to search on a desktop', async () => {
    stubMatchMedia(true)

    const { wrapper } = await mountView()

    expect(wrapper.find('[data-test="search-back-btn"]').exists()).toBe(false)
    expect(wrapper.get('[data-test="search-sidebar"]').text()).toContain('Fringe')
    expect(wrapper.get('[data-test="search-idle"]').text()).toContain('Search shows by name')
  })

  it('goes home from the back button when there is nowhere to go back to', async () => {
    const { wrapper, router } = await mountView()
    const push = vi.spyOn(router, 'push')

    window.history.replaceState(null, '')
    await wrapper.get('[data-test="search-back-btn"]').trigger('click')

    expect(push).toHaveBeenCalledWith({ name: 'home' })
  })

  it('returns to the previous page from the back button', async () => {
    const { wrapper, router } = await mountView()
    const back = vi.spyOn(router, 'back')

    window.history.replaceState({ back: '/' }, '')
    await wrapper.get('[data-test="search-back-btn"]').trigger('click')

    expect(back).toHaveBeenCalledTimes(1)

    window.history.replaceState(null, '')
  })

  it('re-sorts the results on request', async () => {
    const { wrapper, pinia } = await mountView('/search?q=dome')

    await wrapper.get('[data-test="sort-control"]').trigger('click')
    await wrapper.get('[data-test="sort-option-rating"]').trigger('click')
    await flushPromises()

    expect(useSearchStore(pinia).sort).toBe('rating')
  })
})
