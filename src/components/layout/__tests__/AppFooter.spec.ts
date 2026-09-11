import { testPlugins } from '@/__tests__/setup.ts'
import { mount, type VueWrapper } from '@vue/test-utils'
import { it, expect, describe, beforeEach } from 'vitest'
import AppFooter from '@/components/layout/AppFooter.vue'

let wrapper: VueWrapper<any>

function mountWrapper() {
  return mount(AppFooter, { global: { plugins: testPlugins() } })
}

beforeEach(() => {
  wrapper = mountWrapper()
})

describe('AppFooter', () => {
  it('shows the wordmark and the secondary links', () => {
    const footer = wrapper.get('[data-test="app-footer"]')

    expect(footer.text()).toContain('Showtime')
    expect(footer.text()).toContain('Genres')
    expect(footer.text()).toContain('My List')
  })

  it('links the wordmark home and the nav to its pages', () => {
    const hrefs = wrapper.findAll('a').map((link) => link.attributes('href'))
    expect(hrefs).toEqual(['/', '/genres', '/list'])
  })
})
