import { mount } from '@vue/test-utils'
import { it, expect, describe } from 'vitest'
import { testPlugins } from '@/__tests__/setup.ts'
import BottomNav from '@/components/layout/BottomNav.vue'

function mountNav() {
  return mount(BottomNav, { global: { plugins: testPlugins() } })
}

describe('BottomNav', () => {
  it('offers the four main destinations', () => {
    const wrapper = mountNav()

    expect(wrapper.get('[data-test="bottom-nav-home"]').text()).toBe('Home')
    expect(wrapper.get('[data-test="bottom-nav-search"]').text()).toBe('Search')
    expect(wrapper.get('[data-test="bottom-nav-list"]').text()).toBe('List')
  })

  it('links each destination to its page', () => {
    const wrapper = mountNav()

    expect(wrapper.get('[data-test="bottom-nav-home"]').attributes('href')).toBe('/')
    expect(wrapper.get('[data-test="bottom-nav-search"]').attributes('href')).toBe('/search')
    expect(wrapper.get('[data-test="bottom-nav-list"]').attributes('href')).toBe('/list')
  })

  it('is announced as the navigation', () => {
    expect(mountNav().get('[data-test="bottom-nav"]').attributes('aria-label')).toBe('Navigation')
  })
})
