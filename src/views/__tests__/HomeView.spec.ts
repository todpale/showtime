import { createPinia } from 'pinia'
import { apiGet } from '@/utils/api'
import type { HomeFeed } from '@/models'
import HomeView from '@/views/HomeView.vue'
import { makeShow } from '@/__tests__/fixtures'
import { useCatalogStore } from '@/stores/catalog'
import { mount, flushPromises } from '@vue/test-utils'
import { testPlugins, stubMatchMedia } from '@/__tests__/setup.ts'
import { vi, it, expect, describe, afterEach, beforeEach } from 'vitest'

vi.mock('@/utils/api', () => ({ apiGet: vi.fn(), toQuery: vi.fn(() => '') }))

const apiGetMock = vi.mocked(apiGet)

const GENRES = [
  { name: 'Drama', slug: 'drama', total: 120 },
  { name: 'Comedy', slug: 'comedy', total: 90 }
]

const FEED: HomeFeed = {
  rows: [{ name: 'Drama', slug: 'drama', total: 120, shows: [makeShow({ id: 1, name: 'Under the Dome' })] }],
  spotlight: makeShow({ id: 2, name: 'Lost' })
}

function serve(feed: HomeFeed = FEED): void {
  apiGetMock.mockImplementation((path: string) => Promise.resolve(path === '/genres' ? GENRES : feed))
}

function mountView(pinia = createPinia()) {
  return mount(HomeView, { global: { plugins: testPlugins(pinia) } })
}

describe('HomeView', () => {
  beforeEach(() => {
    apiGetMock.mockReset()
    window.localStorage.clear()
    stubMatchMedia(false)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads the catalogue when it opens', async () => {
    serve()

    mountView()
    await flushPromises()

    expect(apiGetMock).toHaveBeenCalledWith('/home', expect.objectContaining({ genre: null }))
  })

  it('shows placeholders while the catalogue loads', async () => {
    serve()

    const wrapper = mountView()

    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-test="home-skeleton"]').exists()).toBe(true)

    await flushPromises()

    expect(wrapper.find('[data-test="home-skeleton"]').exists()).toBe(false)
  })

  it('shows a row for every genre in the feed', async () => {
    serve()

    const wrapper = mountView()

    await flushPromises()

    expect(wrapper.get('[data-test="genre-row-drama"]').text()).toContain('Under the Dome')
  })

  it('says the catalogue is empty when the feed has no rows', async () => {
    serve({ rows: [], spotlight: null })

    const wrapper = mountView()

    await flushPromises()

    expect(wrapper.get('[data-test="home-empty"]').text()).toContain('The catalogue is empty right now.')
  })

  it('reports a failure and offers to try again', async () => {
    apiGetMock.mockRejectedValue(new Error('TVmaze is unreachable'))

    const wrapper = mountView()

    await flushPromises()

    expect(wrapper.get('[data-test="home-error"]').text()).toContain('TVmaze is unreachable')

    serve()
    await wrapper.get('[data-test="state-retry-btn"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="home-error"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="genre-row-drama"]').exists()).toBe(true)
  })

  it('offers a chip for every genre and narrows the catalogue when one is picked', async () => {
    serve()

    const pinia = createPinia()
    const wrapper = mountView(pinia)

    await flushPromises()

    expect(wrapper.get('[data-test="genre-chip-all"]').attributes('aria-pressed')).toBe('true')

    await wrapper.get('[data-test="genre-chip-comedy"]').trigger('click')
    await flushPromises()

    expect(useCatalogStore(pinia).activeGenre).toBe('comedy')
    expect(wrapper.get('[data-test="genre-chip-comedy"]').attributes('aria-pressed')).toBe('true')
  })

  it('offers a search shortcut and the filters on a phone', async () => {
    serve()

    const pinia = createPinia()
    const wrapper = mountView(pinia)

    await flushPromises()

    expect(wrapper.get('[data-test="home-search-link"]').attributes('href')).toBe('/search')
    expect(wrapper.find('[data-test="spotlight"]').exists()).toBe(false)
    expect(useCatalogStore(pinia).filtersOpen).toBe(false)

    await wrapper.get('[data-test="home-filter-btn"]').trigger('click')

    expect(useCatalogStore(pinia).filtersOpen).toBe(true)
  })

  it('leaves the filter sheet to the app shell instead of mounting its own', async () => {
    serve()

    const pinia = createPinia()
    const wrapper = mountView(pinia)

    await flushPromises()

    expect(wrapper.findAll('[data-test="filter-sheet"]')).toHaveLength(0)

    await wrapper.get('[data-test="home-filter-btn"]').trigger('click')
    await flushPromises()

    expect(useCatalogStore(pinia).filtersOpen).toBe(true)
    expect(wrapper.findAll('[data-test="filter-sheet"]')).toHaveLength(0)
  })

  it('leads with the spotlight banner on a desktop', async () => {
    serve()
    stubMatchMedia(true)

    const wrapper = mountView()

    await flushPromises()

    expect(wrapper.get('[data-test="spotlight"]').text()).toContain('Lost')
    expect(wrapper.find('[data-test="home-search-link"]').exists()).toBe(false)
  })
})
