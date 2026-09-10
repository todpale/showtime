import { mount } from '@vue/test-utils'
import { it, expect, describe } from 'vitest'
import { testPlugins } from '@/__tests__/setup.ts'
import ShowTabs from '@/components/show/ShowTabs.vue'

function mountTabs(modelValue: 'episodes' | 'details' | 'cast' | 'similar' = 'episodes') {
  return mount(ShowTabs, { props: { modelValue }, global: { plugins: testPlugins() } })
}

describe('ShowTabs', () => {
  it('offers every detail tab', () => {
    const wrapper = mountTabs()

    expect(wrapper.get('[data-test="detail-tab-episodes"]').text()).toBe('Episodes')
    expect(wrapper.get('[data-test="detail-tab-details"]').text()).toBe('Details')
    expect(wrapper.get('[data-test="detail-tab-cast"]').text()).toBe('Cast & Crew')
    expect(wrapper.get('[data-test="detail-tab-similar"]').text()).toBe('More Like This')
  })

  it('marks the current tab as selected', () => {
    const wrapper = mountTabs('cast')

    expect(wrapper.get('[data-test="detail-tab-cast"]').attributes('aria-selected')).toBe('true')
    expect(wrapper.get('[data-test="detail-tab-episodes"]').attributes('aria-selected')).toBe('false')
  })

  it('reports the tab the viewer picked', async () => {
    const wrapper = mountTabs()

    await wrapper.get('[data-test="detail-tab-similar"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([['similar']])
  })

  it('still reports a click on the tab that is already open', async () => {
    const wrapper = mountTabs('details')

    await wrapper.get('[data-test="detail-tab-details"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([['details']])
  })
})
