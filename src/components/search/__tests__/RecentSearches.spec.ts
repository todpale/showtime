import { it, expect, describe } from 'vitest'
import { testPlugins } from '@/__tests__/setup.ts'
import { mount, type VueWrapper } from '@vue/test-utils'
import RecentSearches from '@/components/search/RecentSearches.vue'

let wrapper: VueWrapper<any>

function mountWrapper(items: string[]) {
  return mount(RecentSearches, { props: { items }, global: { plugins: testPlugins() } })
}

describe('RecentSearches', () => {
  it('renders nothing when there is no history', () => {
    wrapper = mountWrapper([])
    expect(wrapper.find('[data-test="recent-searches"]').exists()).toBe(false)
  })

  it('lists every remembered query', () => {
    wrapper = mountWrapper(['dome', 'lost'])

    expect(wrapper.get('[data-test="recent-search-pill-0"]').text()).toContain('dome')
    expect(wrapper.get('[data-test="recent-search-pill-1"]').text()).toContain('lost')
  })

  it('asks the page to search again for a query that is picked', async () => {
    wrapper = mountWrapper(['dome', 'lost'])

    await wrapper.get('[data-test="recent-search-pill-1"]').get('.recent__label').trigger('click')

    expect(wrapper.emitted('on-pick')).toEqual([['lost']])
  })

  it('asks the page to forget a single query', async () => {
    wrapper = mountWrapper(['dome', 'lost'])

    await wrapper.get('[data-test="recent-search-remove-0"]').trigger('click')

    expect(wrapper.emitted('on-remove')).toEqual([['dome']])
  })

  it('asks the page to forget everything', async () => {
    wrapper = mountWrapper(['dome'])

    await wrapper.get('[data-test="recent-clear-btn"]').trigger('click')

    expect(wrapper.emitted('on-clear')).toHaveLength(1)
  })
})
