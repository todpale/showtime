import { createPinia } from 'pinia'
import { apiGet } from '@/utils/api'
import type { GenrePage } from '@/models'
import GenreView from '@/views/GenreView.vue'
import { useGenreStore } from '@/stores/genre'
import { makeShow } from '@/__tests__/fixtures'
import { mount, flushPromises } from '@vue/test-utils'
import { vi, it, expect, describe, beforeEach } from 'vitest'
import { testPlugins, createTestRouter } from '@/__tests__/setup.ts'

vi.mock('@/utils/api', () => ({ apiGet: vi.fn(), toQuery: vi.fn(() => '') }))

const apiGetMock = vi.mocked(apiGet)

function makePage(overrides: Partial<GenrePage> = {}): GenrePage {
  return {
    name: 'Drama',
    slug: 'drama',
    total: 120,
    matched: 2,
    years: [2013, 2011, 2009],
    shows: [makeShow({ id: 1, name: 'Under the Dome' }), makeShow({ id: 2, name: 'Lost' })],
    ...overrides
  }
}

async function mountView(slug = 'drama') {
  const pinia = createPinia()
  const router = createTestRouter()

  await router.push(`/genres/${slug}`)
  await router.isReady()

  const wrapper = mount(GenreView, { global: { plugins: testPlugins(pinia, router) } })

  await flushPromises()

  return { pinia, router, wrapper }
}

function lastParams(): Record<string, unknown> {
  const calls = apiGetMock.mock.calls

  return (calls[calls.length - 1]?.[1] ?? {}) as Record<string, unknown>
}

describe('GenreView', () => {
  beforeEach(() => {
    apiGetMock.mockReset()
    apiGetMock.mockResolvedValue(makePage())
  })

  it('opens the genre named in the url', async () => {
    await mountView('drama')

    expect(apiGetMock).toHaveBeenCalledWith('/genres/drama', expect.objectContaining({ offset: 0 }))
  })

  it('shows the genre name and how it is sorted', async () => {
    const { wrapper } = await mountView()

    expect(wrapper.get('[data-test="genre-title"]').text()).toBe('Drama')
    expect(wrapper.get('[data-test="genre-subtitle"]').text()).toBe('2 shows · sorted by rating')
  })

  it('counts how much of the genre is on screen', async () => {
    const { wrapper } = await mountView()

    expect(wrapper.get('[data-test="genre-showing"]').text()).toBe('Showing 2 of 2')
  })

  it('leads back to the genre index', async () => {
    const { wrapper } = await mountView()

    expect(wrapper.get('[data-test="genre-breadcrumb"]').attributes('href')).toBe('/genres')
  })

  it('shows a card for every show in the genre', async () => {
    const { wrapper } = await mountView()

    expect(wrapper.get('[data-test="genre-grid"]').text()).toContain('Under the Dome')
    expect(wrapper.find('[data-test="show-card-2"]').exists()).toBe(true)
  })

  it('re-sorts the genre on request', async () => {
    const { wrapper, pinia } = await mountView()

    await wrapper.get('[data-test="sort-control"]').trigger('click')
    await wrapper.get('[data-test="sort-option-name"]').trigger('click')
    await flushPromises()

    expect(useGenreStore(pinia).sort).toBe('name')
    expect(lastParams().sort).toBe('name')
  })

  it('filters by a minimum rating and lifts the filter when the chip is pressed again', async () => {
    const { wrapper, pinia } = await mountView()

    await wrapper.get('[data-test="filter-chip-rating-8"]').trigger('click')
    await flushPromises()

    expect(useGenreStore(pinia).filters.minRating).toBe(8)

    await wrapper.get('[data-test="filter-chip-rating-8"]').trigger('click')
    await flushPromises()

    expect(useGenreStore(pinia).filters.minRating).toBeNull()
  })

  it('filters by year', async () => {
    const { wrapper, pinia } = await mountView()

    await wrapper.get('[data-test="filter-chip-year-2013"]').trigger('click')
    await flushPromises()

    expect(useGenreStore(pinia).filters.year).toBe(2013)
    expect(lastParams().year).toBe(2013)
  })

  it('offers one chip per year the genre reports, in the order it reports them', async () => {
    const { wrapper } = await mountView()

    const years = wrapper.findAll('[data-test^="filter-chip-year-"]')

    expect(years.map((chip) => chip.text())).toEqual(['2013', '2011', '2009'])
  })

  it('marks the chip of the active year as pressed', async () => {
    const { wrapper } = await mountView()

    await wrapper.get('[data-test="filter-chip-year-2011"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-test="filter-chip-year-2011"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('[data-test="filter-chip-year-2013"]').attributes('aria-pressed')).toBe('false')
  })

  it('lifts the year filter when the active chip is pressed again', async () => {
    const { wrapper, pinia } = await mountView()

    await wrapper.get('[data-test="filter-chip-year-2011"]').trigger('click')
    await flushPromises()

    expect(useGenreStore(pinia).filters.year).toBe(2011)

    await wrapper.get('[data-test="filter-chip-year-2011"]').trigger('click')
    await flushPromises()

    expect(useGenreStore(pinia).filters.year).toBeNull()
    expect(lastParams().year).toBeNull()
  })

  it('switches straight from one year to another', async () => {
    const { wrapper, pinia } = await mountView()

    await wrapper.get('[data-test="filter-chip-year-2013"]').trigger('click')
    await flushPromises()

    await wrapper.get('[data-test="filter-chip-year-2009"]').trigger('click')
    await flushPromises()

    expect(useGenreStore(pinia).filters.year).toBe(2009)
    expect(lastParams().year).toBe(2009)
  })

  it('follows the years of the page it just loaded', async () => {
    apiGetMock.mockResolvedValueOnce(makePage())
    apiGetMock.mockResolvedValueOnce(makePage({ years: [2013, 2012] }))

    const { wrapper } = await mountView()

    await wrapper.get('[data-test="filter-chip-rating-8"]').trigger('click')
    await flushPromises()

    const years = wrapper.findAll('[data-test^="filter-chip-year-"]')

    expect(years.map((chip) => chip.text())).toEqual(['2013', '2012'])
  })

  it('renders no year chips when the genre reports no years', async () => {
    apiGetMock.mockResolvedValue(makePage({ years: [] }))

    const { wrapper } = await mountView()

    expect(wrapper.findAll('[data-test^="filter-chip-year-"]')).toEqual([])
    expect(wrapper.findAll('[data-test^="filter-chip-rating-"]')).toHaveLength(3)
    expect(wrapper.find('[data-test="genre-grid"]').exists()).toBe(true)
  })

  it('loads the next page of shows on request', async () => {
    apiGetMock.mockResolvedValueOnce(makePage({ matched: 3 }))
    apiGetMock.mockResolvedValueOnce(makePage({ matched: 3, shows: [makeShow({ id: 3, name: 'Fringe' })] }))

    const { wrapper } = await mountView()

    await wrapper.get('[data-test="genre-load-more-btn"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-test="genre-grid"]').text()).toContain('Fringe')
    expect(wrapper.find('[data-test="genre-load-more-btn"]').exists()).toBe(false)
  })

  it('offers no load more button once everything is shown', async () => {
    const { wrapper } = await mountView()

    expect(wrapper.find('[data-test="genre-load-more-btn"]').exists()).toBe(false)
  })

  it('offers to reset the filters when nothing matches', async () => {
    apiGetMock.mockResolvedValueOnce(makePage())
    apiGetMock.mockResolvedValueOnce(makePage({ matched: 0, shows: [] }))

    const { wrapper, pinia } = await mountView()

    await wrapper.get('[data-test="filter-chip-rating-9"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-test="genre-empty"]').text()).toContain('No shows match these filters.')
    expect(wrapper.get('[data-test="state-retry-btn"]').text()).toBe('Reset filters')

    apiGetMock.mockResolvedValue(makePage())
    await wrapper.get('[data-test="state-retry-btn"]').trigger('click')
    await flushPromises()

    expect(useGenreStore(pinia).filters.minRating).toBeNull()
    expect(wrapper.find('[data-test="genre-grid"]').exists()).toBe(true)
  })

  it('reports a failure and offers to try again', async () => {
    apiGetMock.mockRejectedValueOnce(new Error('Unknown genre "nope"'))

    const { wrapper } = await mountView('nope')

    expect(wrapper.get('[data-test="genre-error"]').text()).toContain('Unknown genre "nope"')

    await wrapper.get('[data-test="state-retry-btn"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="genre-grid"]').exists()).toBe(true)
  })

  it('opens the new genre when the url changes', async () => {
    const { wrapper, router } = await mountView('drama')

    apiGetMock.mockResolvedValue(makePage({ name: 'Comedy', slug: 'comedy' }))
    await router.push('/genres/comedy')
    await flushPromises()

    expect(wrapper.get('[data-test="genre-title"]').text()).toBe('Comedy')
  })
})

describe('GenreView load more failures', () => {
  beforeEach(() => {
    apiGetMock.mockReset()
  })

  function defer<T>(): { promise: Promise<T>, resolve: (value: T) => void } {
    let release: (value: T) => void = () => undefined

    const promise = new Promise<T>((settle) => {
      release = settle
    })

    return { promise, resolve: (value: T) => release(value) }
  }

  async function mountPaged() {
    apiGetMock.mockResolvedValueOnce(makePage({ matched: 3 }))

    return await mountView()
  }

  function cardIds(wrapper: Awaited<ReturnType<typeof mountView>>['wrapper']): string[] {
    return wrapper.get('[data-test="genre-grid"]')
      .findAll('a[data-test^="show-card-"]')
      .map((card) => card.attributes('data-test') ?? '')
  }

  it('offers a load more button while the genre has unseen shows', async () => {
    const { wrapper } = await mountPaged()

    expect(wrapper.get('[data-test="genre-load-more-btn"]').text()).toBe('Load more')
    expect(wrapper.get('[data-test="genre-load-more-btn"]').attributes('disabled')).toBeUndefined()
    expect(wrapper.find('[data-test="genre-load-more-error"]').exists()).toBe(false)
  })

  it('keeps the loaded grid on screen when the next page fails', async () => {
    const { wrapper } = await mountPaged()

    expect(cardIds(wrapper)).toEqual(['show-card-1', 'show-card-2'])

    apiGetMock.mockRejectedValueOnce(new Error('Next page exploded'))
    await wrapper.get('[data-test="genre-load-more-btn"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="genre-grid"]').exists()).toBe(true)
    expect(cardIds(wrapper)).toEqual(['show-card-1', 'show-card-2'])
    expect(wrapper.get('[data-test="genre-grid"]').text()).toContain('Under the Dome')
  })

  it('never replaces the grid with the full page error when the next page fails', async () => {
    const { wrapper, pinia } = await mountPaged()

    apiGetMock.mockRejectedValueOnce(new Error('Next page exploded'))
    await wrapper.get('[data-test="genre-load-more-btn"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="genre-error"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="genre-skeleton"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="genre-empty"]').exists()).toBe(false)
    expect(useGenreStore(pinia).status).toBe('ready')
  })

  it('reports the failure inline underneath the grid', async () => {
    const { wrapper } = await mountPaged()

    apiGetMock.mockRejectedValueOnce(new Error('Next page exploded'))
    await wrapper.get('[data-test="genre-load-more-btn"]').trigger('click')
    await flushPromises()

    const block = wrapper.get('[data-test="genre-load-more-error"]')

    expect(block.text()).toContain('Next page exploded')
    expect(block.get('[data-test="genre-load-more-retry-btn"]').text()).toBe('Try again')
  })

  it('falls back to a generic message when the failure carries no text', async () => {
    const { wrapper, pinia } = await mountPaged()
    const store = useGenreStore(pinia)

    store.moreError = null
    store.moreStatus = 'error'
    await wrapper.vm.$nextTick()

    expect(wrapper.get('[data-test="genre-load-more-error"]').text())
      .toContain('More shows could not be loaded.')
  })

  it('keeps counting only the shows that are really on screen after a failure', async () => {
    const { wrapper } = await mountPaged()

    apiGetMock.mockRejectedValueOnce(new Error('Next page exploded'))
    await wrapper.get('[data-test="genre-load-more-btn"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-test="genre-showing"]').text()).toBe('Showing 2 of 3')
    expect(wrapper.find('[data-test="genre-load-more-btn"]').exists()).toBe(true)
  })

  it('retries the next page and clears the failure once it succeeds', async () => {
    const { wrapper } = await mountPaged()

    apiGetMock.mockRejectedValueOnce(new Error('Next page exploded'))
    await wrapper.get('[data-test="genre-load-more-btn"]').trigger('click')
    await flushPromises()

    apiGetMock.mockResolvedValueOnce(makePage({ matched: 3, shows: [makeShow({ id: 3, name: 'Fringe' })] }))
    await wrapper.get('[data-test="genre-load-more-retry-btn"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="genre-load-more-error"]').exists()).toBe(false)
    expect(cardIds(wrapper)).toEqual(['show-card-1', 'show-card-2', 'show-card-3'])
    expect(wrapper.get('[data-test="genre-grid"]').text()).toContain('Fringe')
    expect(wrapper.find('[data-test="genre-load-more-btn"]').exists()).toBe(false)
  })

  it('asks for the next page again when the retry button is pressed', async () => {
    const { wrapper } = await mountPaged()

    apiGetMock.mockRejectedValueOnce(new Error('Next page exploded'))
    await wrapper.get('[data-test="genre-load-more-btn"]').trigger('click')
    await flushPromises()

    expect(apiGetMock).toHaveBeenCalledTimes(2)

    apiGetMock.mockResolvedValueOnce(makePage({ matched: 3, shows: [makeShow({ id: 3 })] }))
    await wrapper.get('[data-test="genre-load-more-retry-btn"]').trigger('click')
    await flushPromises()

    expect(apiGetMock).toHaveBeenCalledTimes(3)
    expect(lastParams()).toMatchObject({ offset: 2 })
  })

  it('keeps the failure on screen when the retry fails as well', async () => {
    const { wrapper } = await mountPaged()

    apiGetMock.mockRejectedValueOnce(new Error('Next page exploded'))
    await wrapper.get('[data-test="genre-load-more-btn"]').trigger('click')
    await flushPromises()

    apiGetMock.mockRejectedValueOnce(new Error('Still broken'))
    await wrapper.get('[data-test="genre-load-more-retry-btn"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-test="genre-load-more-error"]').text()).toContain('Still broken')
    expect(cardIds(wrapper)).toEqual(['show-card-1', 'show-card-2'])
  })

  it('disables and relabels the load more button while the next page is in flight', async () => {
    const gate = defer<GenrePage>()
    const { wrapper } = await mountPaged()

    apiGetMock.mockReturnValueOnce(gate.promise)
    await wrapper.get('[data-test="genre-load-more-btn"]').trigger('click')
    await wrapper.vm.$nextTick()

    const button = wrapper.get('[data-test="genre-load-more-btn"]')

    expect(button.attributes('disabled')).toBeDefined()
    expect(button.text()).toBe('Loading…')
    expect(wrapper.find('[data-test="genre-load-more-error"]').exists()).toBe(false)

    gate.resolve(makePage({ matched: 4, shows: [makeShow({ id: 3 })] }))
    await flushPromises()

    expect(wrapper.get('[data-test="genre-load-more-btn"]').attributes('disabled')).toBeUndefined()
    expect(wrapper.get('[data-test="genre-load-more-btn"]').text()).toBe('Load more')
  })

  it('drops the inline failure when the genre is reloaded from the controls', async () => {
    const { wrapper } = await mountPaged()

    apiGetMock.mockRejectedValueOnce(new Error('Next page exploded'))
    await wrapper.get('[data-test="genre-load-more-btn"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="genre-load-more-error"]').exists()).toBe(true)

    apiGetMock.mockResolvedValueOnce(makePage({ matched: 3 }))
    await wrapper.get('[data-test="filter-chip-rating-8"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="genre-load-more-error"]').exists()).toBe(false)
  })

  it('drops the inline failure when another genre is opened', async () => {
    const { wrapper, router } = await mountPaged()

    apiGetMock.mockRejectedValueOnce(new Error('Next page exploded'))
    await wrapper.get('[data-test="genre-load-more-btn"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="genre-load-more-error"]').exists()).toBe(true)

    apiGetMock.mockResolvedValueOnce(makePage({ name: 'Comedy', slug: 'comedy', matched: 3 }))
    await router.push('/genres/comedy')
    await flushPromises()

    expect(wrapper.get('[data-test="genre-title"]').text()).toBe('Comedy')
    expect(wrapper.find('[data-test="genre-load-more-error"]').exists()).toBe(false)
  })
})
