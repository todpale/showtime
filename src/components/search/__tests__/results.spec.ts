import { mount } from '@vue/test-utils'
import type { SearchResult } from '@/models'
import { it, expect, describe } from 'vitest'
import { makeResult } from '@/__tests__/fixtures'
import { testPlugins } from '@/__tests__/setup.ts'
import TopResult from '@/components/search/TopResult.vue'
import ResultRow from '@/components/search/ResultRow.vue'

function mountRow(result: SearchResult, index = 0) {
  return mount(ResultRow, { props: { result, index }, global: { plugins: testPlugins() } })
}

function mountTop(result: SearchResult) {
  return mount(TopResult, { props: { result }, global: { plugins: testPlugins() } })
}

describe('ResultRow', () => {
  it('is identified by its position in the result list', () => {
    expect(mountRow(makeResult(), 3).find('[data-test="search-result-row-3"]').exists()).toBe(true)
  })

  it('shows the name of the show', () => {
    expect(mountRow(makeResult({ name: 'Person of Interest' })).text()).toContain('Person of Interest')
  })

  it('links to the show page', () => {
    expect(mountRow(makeResult({ id: 42 })).get('a').attributes('href')).toBe('/shows/42')
  })

  it('shows the genres, the year and the network', () => {
    const wrapper = mountRow(makeResult({ genres: ['Drama', 'Thriller'], year: 2013, network: 'CBS' }))

    expect(wrapper.get('.result__meta').text()).toBe('Drama Thriller · 2013 · CBS')
  })

  it('leaves out a missing year and network', () => {
    const wrapper = mountRow(makeResult({ genres: ['Drama'], year: null, network: null }))

    expect(wrapper.get('.result__meta').text()).toBe('Drama')
  })

  it('shows the rating', () => {
    expect(mountRow(makeResult({ rating: 9 })).get('[data-test="search-result-rating"]').text()).toBe('9.0')
  })

  it('shows an em dash for an unrated show', () => {
    expect(mountRow(makeResult({ rating: null })).get('[data-test="search-result-rating"]').text()).toBe('—')
  })
})

describe('TopResult', () => {
  it('is badged as the top result', () => {
    expect(mountTop(makeResult()).get('[data-test="search-top-result"]').text()).toContain('Top result')
  })

  it('shows the name and the summary of the show', () => {
    const wrapper = mountTop(makeResult({ name: 'Lost', summary: 'A plane crashes on an island.' }))

    expect(wrapper.text()).toContain('Lost')
    expect(wrapper.text()).toContain('A plane crashes on an island.')
  })

  it('leaves out the summary when the show has none', () => {
    expect(mountTop(makeResult({ summary: '' })).find('.top__desc').exists()).toBe(false)
  })

  it('links to the show page', () => {
    expect(mountTop(makeResult({ id: 7 })).get('a').attributes('href')).toBe('/shows/7')
  })

  it('shows the rating', () => {
    expect(mountTop(makeResult({ rating: null })).get('.top__score').text()).toBe('—')
  })
})
