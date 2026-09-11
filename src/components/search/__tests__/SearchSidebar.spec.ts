import { createPinia } from 'pinia'
import { apiGet } from '@/utils/api'
import { makeShow } from '@/__tests__/fixtures'
import { useSearchStore } from '@/stores/search'
import { testPlugins } from '@/__tests__/setup.ts'
import { useCatalogStore } from '@/stores/catalog'
import { vi, it, expect, describe, beforeEach } from 'vitest'
import SearchSidebar from '@/components/search/SearchSidebar.vue'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'

vi.mock('@/utils/api', () => ({ apiGet: vi.fn(), toQuery: vi.fn(() => '') }))

const apiGetMock = vi.mocked(apiGet)

let wrapper: VueWrapper<any>
let search: ReturnType<typeof useSearchStore>

function mountWrapper() {
  const pinia = createPinia()
  const catalog = useCatalogStore(pinia)

  catalog.genres = [
    { name: 'Drama', slug: 'drama', total: 120 },
    { name: 'Comedy', slug: 'comedy', total: 90 }
  ]
  catalog.rows = [{
    name: 'Drama',
    slug: 'drama',
    total: 120,
    shows: [makeShow({ id: 1, name: 'Under the Dome', rating: 6.5 }), makeShow({ id: 2, name: 'Lost' })]
  }]

  search = useSearchStore(pinia)

  return mount(SearchSidebar, { global: { plugins: testPlugins(pinia) } })
}

describe('SearchSidebar', () => {
  beforeEach(() => {
    apiGetMock.mockReset()
    apiGetMock.mockResolvedValue({ query: '', total: 0, results: [] })
    window.localStorage.clear()

    wrapper = mountWrapper()
  })

  it('offers the known genres as filter chips', () => {
    expect(wrapper.get('[data-test="filter-chip-drama"]').text()).toBe('Drama')
    expect(wrapper.get('[data-test="filter-chip-comedy"]').text()).toBe('Comedy')
  })

  it('filters the search by the genre that was picked, and lifts it when picked again', async () => {
    await wrapper.get('[data-test="filter-chip-drama"]').trigger('click')
    await flushPromises()

    expect(search.filters.genre).toBe('drama')

    await wrapper.get('[data-test="filter-chip-drama"]').trigger('click')
    await flushPromises()

    expect(search.filters.genre).toBeNull()
  })

  it('applies a minimum rating to the search', async () => {
    await wrapper.get('[data-test="filter-rating-7"]').trigger('click')
    await flushPromises()

    expect(search.filters.minRating).toBe(7)
  })

  it('lists the trending shows of the first catalogue row', () => {
    const trending = wrapper.get('[data-test="search-trending"]')

    expect(trending.text()).toContain('01')
    expect(trending.text()).toContain('Under the Dome')
    expect(trending.text()).toContain('6.5')
    expect(trending.text()).toContain('Lost')
  })

  it('shows the recent searches and passes a pick up to the page', async () => {
    search.recent = ['dome']
    await wrapper.vm.$nextTick()
    await wrapper.get('[data-test="recent-search-pill-0"]').get('.recent__label').trigger('click')

    expect(wrapper.emitted('on-pick')).toEqual([['dome']])
  })

  it('forgets a recent search on request', async () => {
    search.recent = ['dome', 'lost']
    await wrapper.vm.$nextTick()
    await wrapper.get('[data-test="recent-search-remove-0"]').trigger('click')

    expect(search.recent).toEqual(['lost'])
  })
})
