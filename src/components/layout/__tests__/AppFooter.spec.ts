import { mount } from '@vue/test-utils'
import { it, expect, describe } from 'vitest'
import { testPlugins } from '@/__tests__/setup.ts'
import AppFooter from '@/components/layout/AppFooter.vue'

describe('AppFooter', () => {
  it('shows the wordmark and the secondary links', () => {
    const footer = mount(AppFooter, { global: { plugins: testPlugins() } }).get('[data-test="app-footer"]')

    expect(footer.text()).toContain('Showtime')
    expect(footer.text()).toContain('Genres')
    expect(footer.text()).toContain('My List')
    expect(footer.text()).toContain('About')
    expect(footer.text()).toContain('Terms')
  })

  it('links the wordmark home and the nav to its pages', () => {
    const wrapper = mount(AppFooter, { global: { plugins: testPlugins() } })
    const hrefs = wrapper.findAll('a').map((link) => link.attributes('href'))

    expect(hrefs).toEqual(['/', '/genres', '/list'])
  })
})
