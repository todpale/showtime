import { createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
import type { Router } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import { vi, it, expect, describe, afterEach } from 'vitest'
import { testPlugins, stubMatchMedia, createTestRouter } from '@/__tests__/setup.ts'

function mountHeader(desktop: boolean, router: Router = createTestRouter()) {
  stubMatchMedia(desktop)

  return mount(AppHeader, { global: { plugins: testPlugins(createPinia(), router) } })
}

describe('AppHeader', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('always shows the wordmark', () => {
    const wrapper = mountHeader(false)

    expect(wrapper.get('[data-test="header-wordmark"]').text()).toBe('Showtime')
  })

  it('shows a compact header on a phone', () => {
    const wrapper = mountHeader(false)

    expect(wrapper.get('[data-test="header-list-btn"]').attributes('href')).toBe('/list')
    expect(wrapper.find('[data-test="header-search-input"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="header-nav-home"]').exists()).toBe(false)
  })

  it('shows the full navigation and search on a desktop', () => {
    const wrapper = mountHeader(true)

    expect(wrapper.get('[data-test="header-nav-home"]').text()).toBe('Home')
    expect(wrapper.get('[data-test="header-nav-genres"]').attributes('href')).toBe('/genres')
    expect(wrapper.get('[data-test="header-nav-list"]').attributes('href')).toBe('/list')
    expect(wrapper.find('[data-test="header-search-input"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="header-list-btn"]').exists()).toBe(false)
  })

  it('takes the viewer to the search page when the header search is submitted', async () => {
    const router = createTestRouter()
    const push = vi.spyOn(router, 'push')
    const wrapper = mountHeader(true, router)

    await wrapper.get('[data-test="header-search-input"]').setValue('dome')
    await wrapper.get('form').trigger('submit')

    expect(push).toHaveBeenCalledWith({ name: 'search', query: { q: 'dome' } })
  })

  it('ignores a submit with a blank query', async () => {
    const router = createTestRouter()
    const push = vi.spyOn(router, 'push')
    const wrapper = mountHeader(true, router)

    await wrapper.get('[data-test="header-search-input"]').setValue('   ')
    await wrapper.get('form').trigger('submit')

    expect(push).not.toHaveBeenCalled()
  })

  it('asks the page to open the filters', async () => {
    const wrapper = mountHeader(true)

    await wrapper.get('[data-test="header-filter-btn"]').trigger('click')

    expect(wrapper.emitted('filters')).toHaveLength(1)
  })
})
