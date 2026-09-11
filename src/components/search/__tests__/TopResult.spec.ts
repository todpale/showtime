import type { SearchResult } from '@/models'
import { it, expect, describe } from 'vitest'
import { makeResult } from '@/__tests__/fixtures'
import { testPlugins } from '@/__tests__/setup.ts'
import { mount, type VueWrapper } from '@vue/test-utils'
import TopResult from '@/components/search/TopResult.vue'

let wrapper: VueWrapper<any>

function mountWrapper(result: SearchResult) {
  return mount(TopResult, { props: { result }, global: { plugins: testPlugins() } })
}

describe('TopResult', () => {
  it('is badged as the top result', () => {
    wrapper = mountWrapper(makeResult())
    expect(wrapper.get('[data-test="search-top-result"]').text()).toContain('Top result')
  })

  it('shows the name and the summary of the show', () => {
    wrapper = mountWrapper(makeResult({ name: 'Lost', summary: 'A plane crashes on an island.' }))

    expect(wrapper.text()).toContain('Lost')
    expect(wrapper.text()).toContain('A plane crashes on an island.')
  })

  it('leaves out the summary when the show has none', () => {
    wrapper = mountWrapper(makeResult({ summary: '' }))
    expect(wrapper.find('.top__desc').exists()).toBe(false)
  })

  it('links to the show page', () => {
    wrapper = mountWrapper(makeResult({ id: 7 }))
    expect(wrapper.get('a').attributes('href')).toBe('/shows/7')
  })

  it('shows the rating', () => {
    wrapper = mountWrapper(makeResult({ rating: null }))
    expect(wrapper.get('.top__score').text()).toBe('—')
  })
})
