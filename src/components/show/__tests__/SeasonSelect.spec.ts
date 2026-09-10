import { mount } from '@vue/test-utils'
import { it, expect, describe } from 'vitest'
import { testPlugins } from '@/__tests__/setup.ts'
import SeasonSelect from '@/components/show/SeasonSelect.vue'

function mountSelect(seasons: number[], modelValue: number, count: number) {
  return mount(SeasonSelect, {
    props: { seasons, modelValue, count },
    global: { plugins: testPlugins() }
  })
}

describe('SeasonSelect', () => {
  it('lists every season of the show', () => {
    const options = mountSelect([1, 2, 3], 1, 13).findAll('option')

    expect(options.map((option) => option.text())).toEqual(['Season 1', 'Season 2', 'Season 3'])
  })

  it('shows the season that is open', () => {
    const select = mountSelect([1, 2, 3], 2, 13).get('[data-test="detail-season-select"]')

    expect((select.element as HTMLSelectElement).value).toBe('2')
  })

  it('counts the episodes of the open season', () => {
    expect(mountSelect([1], 1, 13).get('[data-test="detail-episode-count"]').text()).toBe('13 episodes')
  })

  it('uses the singular for a single episode', () => {
    expect(mountSelect([1], 1, 1).get('[data-test="detail-episode-count"]').text()).toBe('1 episode')
  })

  it('reports the season the viewer picked as a number', async () => {
    const wrapper = mountSelect([1, 2, 3], 1, 13)

    await wrapper.get('[data-test="detail-season-select"]').setValue('3')

    expect(wrapper.emitted('update:modelValue')).toEqual([[3]])
  })
})
