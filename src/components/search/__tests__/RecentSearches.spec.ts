import { mount } from '@vue/test-utils'
import { it, expect, describe } from 'vitest'
import { testPlugins } from '@/__tests__/setup.ts'
import RecentSearches from '@/components/search/RecentSearches.vue'

function mountRecent(items: string[]) {
  return mount(RecentSearches, { props: { items }, global: { plugins: testPlugins() } })
}

describe('RecentSearches', () => {
  it('renders nothing when there is no history', () => {
    expect(mountRecent([]).find('[data-test="recent-searches"]').exists()).toBe(false)
  })

  it('lists every remembered query', () => {
    const wrapper = mountRecent(['dome', 'lost'])

    expect(wrapper.get('[data-test="recent-search-pill-0"]').text()).toContain('dome')
    expect(wrapper.get('[data-test="recent-search-pill-1"]').text()).toContain('lost')
  })

  it('asks the page to search again for a query that is picked', async () => {
    const wrapper = mountRecent(['dome', 'lost'])

    await wrapper.get('[data-test="recent-search-pill-1"]').get('.recent__label').trigger('click')

    expect(wrapper.emitted('on-pick')).toEqual([['lost']])
  })

  it('asks the page to forget a single query', async () => {
    const wrapper = mountRecent(['dome', 'lost'])

    await wrapper.get('[data-test="recent-search-remove-0"]').trigger('click')

    expect(wrapper.emitted('on-remove')).toEqual([['dome']])
  })

  it('asks the page to forget everything', async () => {
    const wrapper = mountRecent(['dome'])

    await wrapper.get('[data-test="recent-clear-btn"]').trigger('click')

    expect(wrapper.emitted('on-clear')).toHaveLength(1)
  })
})
