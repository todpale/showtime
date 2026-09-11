import { it, expect, describe } from 'vitest'
import { testPlugins } from '@/__tests__/setup.ts'
import { mount, type VueWrapper } from '@vue/test-utils'
import RatingFilter from '@/components/genre/RatingFilter.vue'

let wrapper: VueWrapper<any>

function mountWrapper(modelValue: number | null) {
  return mount(RatingFilter, { props: { modelValue }, global: { plugins: testPlugins() } })
}

describe('RatingFilter', () => {
  it('offers any rating plus the three thresholds', () => {
    wrapper = mountWrapper(null)

    expect(wrapper.get('[data-test="filter-rating-any"]').text()).toBe('Any')
    expect(wrapper.get('[data-test="filter-rating-7"]').text()).toBe('7+')
    expect(wrapper.get('[data-test="filter-rating-8"]').text()).toBe('8+')
    expect(wrapper.get('[data-test="filter-rating-9"]').text()).toBe('9+')
  })

  it('marks the chosen threshold as pressed', () => {
    wrapper = mountWrapper(8)

    expect(wrapper.get('[data-test="filter-rating-8"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('[data-test="filter-rating-any"]').attributes('aria-pressed')).toBe('false')
  })

  it('marks any rating as pressed when no minimum is set', () => {
    wrapper = mountWrapper(null)
    expect(wrapper.get('[data-test="filter-rating-any"]').attributes('aria-pressed')).toBe('true')
  })

  it('reports the chosen threshold', async () => {
    wrapper = mountWrapper(null)

    await wrapper.get('[data-test="filter-rating-9"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[9]])
  })

  it('reports null when the minimum is lifted', async () => {
    wrapper = mountWrapper(9)

    await wrapper.get('[data-test="filter-rating-any"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[null]])
  })
})
