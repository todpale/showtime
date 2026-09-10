import { mount } from '@vue/test-utils'
import { it, expect, describe } from 'vitest'
import { testPlugins } from '@/__tests__/setup.ts'
import RatingFilter from '@/components/genre/RatingFilter.vue'

function mountFilter(modelValue: number | null) {
  return mount(RatingFilter, { props: { modelValue }, global: { plugins: testPlugins() } })
}

describe('RatingFilter', () => {
  it('offers any rating plus the three thresholds', () => {
    const wrapper = mountFilter(null)

    expect(wrapper.get('[data-test="filter-rating-any"]').text()).toBe('Any')
    expect(wrapper.get('[data-test="filter-rating-7"]').text()).toBe('7+')
    expect(wrapper.get('[data-test="filter-rating-8"]').text()).toBe('8+')
    expect(wrapper.get('[data-test="filter-rating-9"]').text()).toBe('9+')
  })

  it('marks the chosen threshold as pressed', () => {
    const wrapper = mountFilter(8)

    expect(wrapper.get('[data-test="filter-rating-8"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('[data-test="filter-rating-any"]').attributes('aria-pressed')).toBe('false')
  })

  it('marks any rating as pressed when no minimum is set', () => {
    expect(mountFilter(null).get('[data-test="filter-rating-any"]').attributes('aria-pressed')).toBe('true')
  })

  it('reports the chosen threshold', async () => {
    const wrapper = mountFilter(null)

    await wrapper.get('[data-test="filter-rating-9"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[9]])
  })

  it('reports null when the minimum is lifted', async () => {
    const wrapper = mountFilter(9)

    await wrapper.get('[data-test="filter-rating-any"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[null]])
  })
})
