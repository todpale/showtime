import type { SortOption } from '@/models'
import { testPlugins } from '@/__tests__/setup.ts'
import { mount, type VueWrapper } from '@vue/test-utils'
import { it, expect, describe, beforeEach } from 'vitest'
import SortControl from '@/components/ui/SortControl.vue'

const testOptions: SortOption[] = [
  { key: 'rating', label: 'Rating' },
  { key: 'year', label: 'Year (newest)' },
  { key: 'name', label: 'Title' }
]

let wrapper: VueWrapper<any>

function mountWrapper() {
  return mount(SortControl, {
    props: { modelValue: 'rating', options: testOptions },
    global: { plugins: testPlugins() }
  })
}

beforeEach(() => {
  wrapper = mountWrapper()
})

describe('SortControl', () => {
  it('names the active sort on the toggle', () => {
    expect(wrapper.get('[data-test="sort-control"]').text()).toBe('Sort: Rating')
  })

  it('keeps the options hidden until the toggle is pressed', async () => {
    expect(wrapper.find('[data-test="sort-option-year"]').exists()).toBe(false)

    await wrapper.get('[data-test="sort-control"]').trigger('click')

    expect(wrapper.find('[data-test="sort-option-year"]').exists()).toBe(true)
    expect(wrapper.get('[data-test="sort-control"]').attributes('aria-expanded')).toBe('true')
  })

  it('marks the active option as selected', async () => {
    await wrapper.get('[data-test="sort-control"]').trigger('click')

    expect(wrapper.get('[data-test="sort-option-rating"]').attributes('aria-selected')).toBe('true')
    expect(wrapper.get('[data-test="sort-option-year"]').attributes('aria-selected')).toBe('false')
  })

  it('reports the chosen sort and closes the menu', async () => {
    await wrapper.get('[data-test="sort-control"]').trigger('click')
    await wrapper.get('[data-test="sort-option-year"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([['year']])
    expect(wrapper.find('[data-test="sort-option-year"]').exists()).toBe(false)
  })
})
