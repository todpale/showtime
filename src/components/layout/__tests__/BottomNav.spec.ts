import { testPlugins } from '@/__tests__/setup.ts'
import { mount, type VueWrapper } from '@vue/test-utils'
import { it, expect, describe, beforeEach } from 'vitest'
import BottomNav from '@/components/layout/BottomNav.vue'

let wrapper: VueWrapper<any>

function mountWrapper() {
  return mount(BottomNav, { global: { plugins: testPlugins() } })
}

beforeEach(() => {
  wrapper = mountWrapper()
})

describe('BottomNav', () => {
  it('offers the four main destinations', () => {
    expect(wrapper.get('[data-test="bottom-nav-home"]').text()).toBe('Home')
    expect(wrapper.get('[data-test="bottom-nav-search"]').text()).toBe('Search')
    expect(wrapper.get('[data-test="bottom-nav-list"]').text()).toBe('List')
  })

  it('links each destination to its page', () => {
    expect(wrapper.get('[data-test="bottom-nav-home"]').attributes('href')).toBe('/')
    expect(wrapper.get('[data-test="bottom-nav-search"]').attributes('href')).toBe('/search')
    expect(wrapper.get('[data-test="bottom-nav-list"]').attributes('href')).toBe('/list')
  })

  it('is announced as the navigation', () => {
    expect(wrapper.get('[data-test="bottom-nav"]').attributes('aria-label')).toBe('Navigation')
  })
})
