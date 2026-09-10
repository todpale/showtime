import { createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
import type { ShowSummary } from '@/models'
import { useListStore } from '@/stores/list'
import { makeShow } from '@/__tests__/fixtures'
import { testPlugins } from '@/__tests__/setup.ts'
import { it, expect, describe, beforeEach } from 'vitest'
import SpotlightBanner from '@/components/show/SpotlightBanner.vue'

function mountBanner(show: ShowSummary, pinia = createPinia()) {
  return {
    pinia,
    wrapper: mount(SpotlightBanner, { props: { show }, global: { plugins: testPlugins(pinia) } })
  }
}

describe('SpotlightBanner', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('shows the featured show', () => {
    const { wrapper } = mountBanner(makeShow({ name: 'Under the Dome' }))

    expect(wrapper.get('[data-test="spotlight"]').text()).toContain('Under the Dome')
  })

  it('names the network that made the show', () => {
    const { wrapper } = mountBanner(makeShow({ network: 'CBS' }))

    expect(wrapper.text()).toContain('CBS original series')
  })

  it('falls back to a generic eyebrow when there is no network', () => {
    const { wrapper } = mountBanner(makeShow({ network: null }))

    expect(wrapper.text()).toContain('Featured this week')
  })

  it('shows the year, the type and the genres', () => {
    const { wrapper } = mountBanner(makeShow({ year: 2013, type: 'Scripted', genres: ['Drama', 'Thriller'] }))

    expect(wrapper.get('.spotlight__meta-line').text()).toBe('2013 · Scripted · Drama, Thriller')
  })

  it('links to the show page', () => {
    const { wrapper } = mountBanner(makeShow({ id: 42 }))

    expect(wrapper.get('[data-test="spotlight-watch-btn"]').attributes('href')).toBe('/shows/42')
  })

  it('prefers the backdrop over the poster for its artwork', () => {
    const { wrapper } = mountBanner(makeShow({ backdrop: 'https://img/bg.jpg' }))

    expect(wrapper.get('.spotlight__art').attributes('src')).toBe('https://img/bg.jpg')
  })

  it('adds the show to my list and offers to remove it again', async () => {
    const pinia = createPinia()
    const { wrapper } = mountBanner(makeShow({ id: 42 }), pinia)
    const button = wrapper.get('[data-test="spotlight-list-btn"]')

    expect(button.text()).toBe('Add to list')

    await button.trigger('click')

    expect(useListStore(pinia).has(42)).toBe(true)
    expect(wrapper.get('[data-test="spotlight-list-btn"]').text()).toBe('In My List')

    await wrapper.get('[data-test="spotlight-list-btn"]').trigger('click')

    expect(useListStore(pinia).has(42)).toBe(false)
  })

  it('shows a show that is already saved as being in my list', () => {
    const pinia = createPinia()

    useListStore(pinia).add(makeShow({ id: 42 }))

    const { wrapper } = mountBanner(makeShow({ id: 42 }), pinia)

    expect(wrapper.get('[data-test="spotlight-list-btn"]').text()).toBe('In My List')
  })
})
