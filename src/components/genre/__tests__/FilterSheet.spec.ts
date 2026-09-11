import { createPinia } from 'pinia'
import { apiGet } from '@/utils/api'
import { testPlugins } from '@/__tests__/setup.ts'
import { useCatalogStore } from '@/stores/catalog'
import { ref, type Ref, defineComponent } from 'vue'
import FilterSheet from '@/components/genre/FilterSheet.vue'
import { vi, it, expect, describe, afterEach, beforeEach } from 'vitest'
import { mount, flushPromises, type VueWrapper, enableAutoUnmount } from '@vue/test-utils'

vi.mock('@/utils/api', () => ({ apiGet: vi.fn(), toQuery: vi.fn(() => '') }))

const apiGetMock = vi.mocked(apiGet)

let wrapper: VueWrapper<any>
let open: Ref<boolean>
let onClose: ReturnType<typeof vi.fn>
let catalog: ReturnType<typeof useCatalogStore>

function seedCatalog() {
  const pinia = createPinia()

  catalog = useCatalogStore(pinia)
  catalog.genres = [
    { name: 'Drama', slug: 'drama', total: 120 },
    { name: 'Comedy', slug: 'comedy', total: 90 }
  ]

  return pinia
}

function mountWrapper() {
  return mount(FilterSheet, {
    attachTo: document.body,
    global: { plugins: testPlugins(seedCatalog()) }
  })
}

function pressKey(key: string): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { key }))
}

function mountHost() {
  const pinia = seedCatalog()

  open = ref(true)
  onClose = vi.fn()

  const host = defineComponent({
    name: 'SheetHost',
    components: { FilterSheet },
    setup: () => ({ open, onClose }),
    template: '<filter-sheet v-if="open" @on-close="onClose" />'
  })

  return mount(host, { attachTo: document.body, global: { plugins: testPlugins(pinia) } })
}

beforeEach(() => {
  apiGetMock.mockReset()
  apiGetMock.mockResolvedValue({ rows: [], spotlight: null })
  wrapper = mountWrapper()
})

afterEach(() => {
  vi.restoreAllMocks()
})

enableAutoUnmount(afterEach)

describe('FilterSheet', () => {
  it('lists an "all" chip alongside the known genres', () => {
    expect(wrapper.get('[data-test="filter-chip-all"]').text()).toBe('All')
    expect(wrapper.get('[data-test="filter-chip-drama"]').text()).toBe('Drama')
    expect(wrapper.get('[data-test="filter-chip-comedy"]').text()).toBe('Comedy')
  })

  it('marks "all" as active while no genre is chosen', () => {
    expect(wrapper.get('[data-test="filter-chip-all"]').attributes('aria-pressed')).toBe('true')
  })

  it('narrows the catalogue to the genre that was picked', async () => {
    await wrapper.get('[data-test="filter-chip-comedy"]').trigger('click')
    await flushPromises()

    expect(catalog.activeGenre).toBe('comedy')
    expect(wrapper.get('[data-test="filter-chip-comedy"]').attributes('aria-pressed')).toBe('true')
  })

  it('goes back to every genre when "all" is picked', async () => {
    await wrapper.get('[data-test="filter-chip-drama"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-test="filter-chip-all"]').trigger('click')
    await flushPromises()

    expect(catalog.activeGenre).toBeNull()
  })

  it('applies a minimum rating', async () => {
    await wrapper.get('[data-test="filter-rating-8"]').trigger('click')
    await flushPromises()

    expect(catalog.filters.minRating).toBe(8)
  })

  it('resets the rating but keeps the genre', async () => {
    await wrapper.get('[data-test="filter-chip-drama"]').trigger('click')
    await wrapper.get('[data-test="filter-rating-9"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-test="filter-reset-btn"]').trigger('click')
    await flushPromises()

    expect(catalog.filters).toEqual({ year: null, genre: 'drama', minRating: null })
  })

  it('asks the page to close from the close button and from the backdrop', async () => {
    await wrapper.get('[data-test="filter-close-btn"]').trigger('click')
    await wrapper.get('[data-test="filter-sheet-scrim-btn"]').trigger('click')

    expect(wrapper.emitted('on-close')).toHaveLength(2)
  })

  it('names both dismiss controls "Close" rather than "Clear"', () => {
    const scrim = wrapper.get('[data-test="filter-sheet-scrim-btn"]')
    const close = wrapper.get('[data-test="filter-close-btn"]')

    expect(scrim.attributes('aria-label')).toBe('Close')
    expect(close.attributes('aria-label')).toBe('Close')
    expect(scrim.attributes('aria-label')).not.toBe('Clear')
    expect(close.attributes('aria-label')).not.toBe('Clear')
  })

  it('keeps the dismiss controls distinguishable from the reset control', () => {
    const reset = wrapper.get('[data-test="filter-reset-btn"]')
    const close = wrapper.get('[data-test="filter-close-btn"]')

    expect(reset.text()).toBe('Reset filters')
    expect(reset.text()).not.toBe(close.attributes('aria-label'))
  })

  it('asks the page to close when Escape is pressed', () => {
    pressKey('Escape')
    expect(wrapper.emitted('on-close')).toHaveLength(1)
  })

  it('stays open on any other key', () => {
    pressKey('Enter')
    pressKey('Tab')
    pressKey('a')

    expect(wrapper.emitted('on-close')).toBeUndefined()
  })

  it('stops listening for Escape once it is gone', async () => {
    wrapper = mountHost()

    pressKey('Escape')

    expect(onClose).toHaveBeenCalledTimes(1)

    open.value = false
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-test="filter-sheet"]').exists()).toBe(false)

    pressKey('Escape')

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('leaves no keydown listener behind on the window', () => {
    const added = vi.spyOn(window, 'addEventListener')
    const removed = vi.spyOn(window, 'removeEventListener')

    wrapper = mountWrapper()

    const registrations = added.mock.calls.filter(([type]) => type === 'keydown')

    expect(registrations).toHaveLength(1)

    wrapper.unmount()

    const removals = removed.mock.calls.filter(([type]) => type === 'keydown')

    expect(removals).toHaveLength(1)
    expect(removals[0]?.[1]).toBe(registrations[0]?.[1])
  })

  it('moves the focus onto the close button so the keyboard starts inside the sheet', async () => {
    await wrapper.vm.$nextTick()
    expect(document.activeElement).toBe(wrapper.get('[data-test="filter-close-btn"]').element)
  })

  it('announces the panel as a modal dialog named after the filters', () => {
    const panel = wrapper.get('[role="dialog"]')

    expect(panel.attributes('aria-modal')).toBe('true')
    expect(panel.attributes('aria-label')).toBe('Filter')
  })
})
