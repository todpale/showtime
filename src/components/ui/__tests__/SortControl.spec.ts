import { mount } from '@vue/test-utils'
import type { SortOption } from '@/models'
import { it, expect, describe } from 'vitest'
import { testPlugins } from '@/__tests__/setup.ts'
import SortControl from '@/components/ui/SortControl.vue'

const OPTIONS: SortOption[] = [
  { key: 'rating', label: 'Rating' },
  { key: 'year', label: 'Year (newest)' },
  { key: 'name', label: 'Title' }
]

function mountControl() {
  return mount(SortControl, {
    props: { modelValue: 'rating', options: OPTIONS },
    global: { plugins: testPlugins() }
  })
}

describe('SortControl', () => {
  it('names the active sort on the toggle', () => {
    expect(mountControl().get('[data-test="sort-control"]').text()).toBe('Sort: Rating')
  })

  it('keeps the options hidden until the toggle is pressed', async () => {
    const wrapper = mountControl()

    expect(wrapper.find('[data-test="sort-option-year"]').exists()).toBe(false)

    await wrapper.get('[data-test="sort-control"]').trigger('click')

    expect(wrapper.find('[data-test="sort-option-year"]').exists()).toBe(true)
    expect(wrapper.get('[data-test="sort-control"]').attributes('aria-expanded')).toBe('true')
  })

  it('marks the active option as selected', async () => {
    const wrapper = mountControl()

    await wrapper.get('[data-test="sort-control"]').trigger('click')

    expect(wrapper.get('[data-test="sort-option-rating"]').attributes('aria-selected')).toBe('true')
    expect(wrapper.get('[data-test="sort-option-year"]').attributes('aria-selected')).toBe('false')
  })

  it('reports the chosen sort and closes the menu', async () => {
    const wrapper = mountControl()

    await wrapper.get('[data-test="sort-control"]').trigger('click')
    await wrapper.get('[data-test="sort-option-year"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([['year']])
    expect(wrapper.find('[data-test="sort-option-year"]').exists()).toBe(false)
  })
})
