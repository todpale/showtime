import type { SearchResult } from '@/models'
import { it, expect, describe } from 'vitest'
import { makeResult } from '@/__tests__/fixtures'
import { testPlugins } from '@/__tests__/setup.ts'
import { mount, type VueWrapper } from '@vue/test-utils'
import ResultRow from '@/components/search/ResultRow.vue'

let wrapper: VueWrapper<any>

function mountWrapper(result: SearchResult, index = 0) {
  return mount(ResultRow, { props: { result, index }, global: { plugins: testPlugins() } })
}

describe('ResultRow', () => {
  it('is identified by its position in the result list', () => {
    wrapper = mountWrapper(makeResult(), 3)
    expect(wrapper.find('[data-test="search-result-row-3"]').exists()).toBe(true)
  })

  it('shows the name of the show', () => {
    wrapper = mountWrapper(makeResult({ name: 'Person of Interest' }))
    expect(wrapper.text()).toContain('Person of Interest')
  })

  it('links to the show page', () => {
    wrapper = mountWrapper(makeResult({ id: 42 }))
    expect(wrapper.get('a').attributes('href')).toBe('/shows/42')
  })

  it('shows the genres, the year and the network', () => {
    wrapper = mountWrapper(makeResult({ genres: ['Drama', 'Thriller'], year: 2013, network: 'CBS' }))
    expect(wrapper.get('.result__meta').text()).toBe('Drama Thriller · 2013 · CBS')
  })

  it('leaves out a missing year and network', () => {
    wrapper = mountWrapper(makeResult({ genres: ['Drama'], year: null, network: null }))
    expect(wrapper.get('.result__meta').text()).toBe('Drama')
  })

  it('shows the rating', () => {
    wrapper = mountWrapper(makeResult({ rating: 9 }))
    expect(wrapper.get('[data-test="search-result-rating"]').text()).toBe('9.0')
  })

  it('shows an em dash for an unrated show', () => {
    wrapper = mountWrapper(makeResult({ rating: null }))
    expect(wrapper.get('[data-test="search-result-rating"]').text()).toBe('—')
  })
})
