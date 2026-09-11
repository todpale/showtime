import { it, expect, describe } from 'vitest'
import { testPlugins } from '@/__tests__/setup.ts'
import ShowTabs from '@/components/show/ShowTabs.vue'
import { mount, type VueWrapper } from '@vue/test-utils'

let wrapper: VueWrapper<any>

function mountWrapper(modelValue: 'episodes' | 'details' | 'cast' | 'similar' = 'episodes') {
  return mount(ShowTabs, { props: { modelValue }, global: { plugins: testPlugins() } })
}

describe('ShowTabs', () => {
  it('offers every detail tab', () => {
    wrapper = mountWrapper()

    expect(wrapper.get('[data-test="detail-tab-episodes"]').text()).toBe('Episodes')
    expect(wrapper.get('[data-test="detail-tab-details"]').text()).toBe('Details')
    expect(wrapper.get('[data-test="detail-tab-cast"]').text()).toBe('Cast & Crew')
    expect(wrapper.get('[data-test="detail-tab-similar"]').text()).toBe('More Like This')
  })

  it('marks the current tab as selected', () => {
    wrapper = mountWrapper('cast')

    expect(wrapper.get('[data-test="detail-tab-cast"]').attributes('aria-selected')).toBe('true')
    expect(wrapper.get('[data-test="detail-tab-episodes"]').attributes('aria-selected')).toBe('false')
  })

  it('reports the tab the viewer picked', async () => {
    wrapper = mountWrapper()

    await wrapper.get('[data-test="detail-tab-similar"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([['similar']])
  })

  it('still reports a click on the tab that is already open', async () => {
    wrapper = mountWrapper('details')

    await wrapper.get('[data-test="detail-tab-details"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([['details']])
  })
})
