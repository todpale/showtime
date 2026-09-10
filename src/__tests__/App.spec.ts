import App from '@/App.vue'
import type { Pinia } from 'pinia'
import { createPinia } from 'pinia'
import { apiGet } from '@/utils/api'
import type { Component } from 'vue'
import HomeView from '@/views/HomeView.vue'
import { makeShow } from '@/__tests__/fixtures'
import { useCatalogStore } from '@/stores/catalog'
import { mount, flushPromises } from '@vue/test-utils'
import AppHeader from '@/components/layout/AppHeader.vue'
import FilterSheet from '@/components/genre/FilterSheet.vue'
import { vi, it, expect, describe, afterEach, beforeEach } from 'vitest'
import { testPlugins, stubMatchMedia, createTestRouter } from '@/__tests__/setup.ts'

vi.mock('@/utils/api', () => ({ apiGet: vi.fn(), toQuery: vi.fn(() => '') }))

const apiGetMock = vi.mocked(apiGet)

const GENRES = [
  { name: 'Drama', slug: 'drama', total: 120 },
  { name: 'Comedy', slug: 'comedy', total: 90 }
]

function serveHome(spotlight: ReturnType<typeof makeShow> | null = null): void {
  apiGetMock.mockImplementation((path: string) => Promise
    .resolve(path === '/genres' ? GENRES : { rows: [], spotlight }))
}

async function mountApp(desktop: boolean, pinia: Pinia = createPinia(), home?: Component) {
  stubMatchMedia(desktop)

  const router = createTestRouter(home)

  await router.push('/')
  await router.isReady()

  return mount(App, { global: { plugins: testPlugins(pinia, router) } })
}

describe('App', () => {
  beforeEach(() => {
    apiGetMock.mockReset()
    apiGetMock.mockResolvedValue({ rows: [], spotlight: null })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('frames the app with the header and the current page', async () => {
    const wrapper = await mountApp(false)

    expect(wrapper.find('[data-test="app-header"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="app-main"]').exists()).toBe(true)
  })

  it('uses the bottom navigation on a phone', async () => {
    const wrapper = await mountApp(false)

    expect(wrapper.find('[data-test="bottom-nav"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="app-footer"]').exists()).toBe(false)
  })

  it('uses the footer on a desktop', async () => {
    const wrapper = await mountApp(true)

    expect(wrapper.find('[data-test="app-footer"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="bottom-nav"]').exists()).toBe(false)
  })

  it('keeps the filter sheet closed until the header asks for it', async () => {
    const wrapper = await mountApp(true)

    expect(wrapper.find('[data-test="filter-sheet"]').exists()).toBe(false)

    await wrapper.get('[data-test="header-filter-btn"]').trigger('click')

    expect(wrapper.find('[data-test="filter-sheet"]').exists()).toBe(true)
  })

  it('closes the filter sheet again', async () => {
    const wrapper = await mountApp(true)

    await wrapper.get('[data-test="header-filter-btn"]').trigger('click')
    await wrapper.get('[data-test="filter-close-btn"]').trigger('click')

    expect(wrapper.find('[data-test="filter-sheet"]').exists()).toBe(false)
  })

  it('mirrors the shared open flag rather than a local one', async () => {
    const pinia = createPinia()
    const wrapper = await mountApp(true, pinia)
    const catalog = useCatalogStore(pinia)

    expect(wrapper.find('[data-test="filter-sheet"]').exists()).toBe(false)

    catalog.openFilters()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-test="filter-sheet"]').exists()).toBe(true)

    catalog.closeFilters()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-test="filter-sheet"]').exists()).toBe(false)
  })

  it('opens the sheet when the header asks for the filters', async () => {
    const pinia = createPinia()
    const wrapper = await mountApp(true, pinia)
    const catalog = useCatalogStore(pinia)

    wrapper.findComponent(AppHeader).vm.$emit('filters')
    await wrapper.vm.$nextTick()

    expect(catalog.filtersOpen).toBe(true)
    expect(wrapper.find('[data-test="filter-sheet"]').exists()).toBe(true)
  })

  it('closes the sheet when the sheet asks for it', async () => {
    const pinia = createPinia()
    const wrapper = await mountApp(true, pinia)
    const catalog = useCatalogStore(pinia)

    catalog.openFilters()
    await wrapper.vm.$nextTick()

    wrapper.findComponent(FilterSheet).vm.$emit('on-close')
    await wrapper.vm.$nextTick()

    expect(catalog.filtersOpen).toBe(false)
    expect(wrapper.find('[data-test="filter-sheet"]').exists()).toBe(false)
  })

  it('mounts a single filter sheet even when both filter buttons are on screen', async () => {
    serveHome()

    const pinia = createPinia()
    const wrapper = await mountApp(true, pinia, HomeView)

    await flushPromises()

    expect(wrapper.find('[data-test="header-filter-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="home-filter-btn"]').exists()).toBe(true)

    await wrapper.get('[data-test="home-filter-btn"]').trigger('click')

    expect(wrapper.findAll('[data-test="filter-sheet"]')).toHaveLength(1)

    await wrapper.get('[data-test="filter-close-btn"]').trigger('click')

    expect(wrapper.findAll('[data-test="filter-sheet"]')).toHaveLength(0)

    await wrapper.get('[data-test="header-filter-btn"]').trigger('click')

    expect(wrapper.findAll('[data-test="filter-sheet"]')).toHaveLength(1)
  })

  it('shares one sheet between the header button and the page button', async () => {
    serveHome()

    const pinia = createPinia()
    const wrapper = await mountApp(true, pinia, HomeView)
    const catalog = useCatalogStore(pinia)

    await flushPromises()
    await wrapper.get('[data-test="header-filter-btn"]').trigger('click')

    expect(catalog.filtersOpen).toBe(true)

    await wrapper.get('[data-test="filter-sheet-scrim-btn"]').trigger('click')

    expect(catalog.filtersOpen).toBe(false)
    expect(wrapper.findAll('[data-test="filter-sheet"]')).toHaveLength(0)
  })
})
