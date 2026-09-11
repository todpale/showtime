import { createPinia } from 'pinia'
import ListView from '@/views/ListView.vue'
import { useListStore } from '@/stores/list'
import { makeShow } from '@/__tests__/fixtures'
import { testPlugins } from '@/__tests__/setup.ts'
import { mount, type VueWrapper } from '@vue/test-utils'
import { it, expect, describe, beforeEach } from 'vitest'

let wrapper: VueWrapper<any>

function mountWrapper(pinia = createPinia()) {
  return mount(ListView, { global: { plugins: testPlugins(pinia) } })
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('ListView', () => {
  it('is titled My List', () => {
    wrapper = mountWrapper()
    expect(wrapper.get('[data-test="list-view"]').text()).toContain('My List')
  })

  it('explains how to fill an empty list', () => {
    wrapper = mountWrapper()

    expect(wrapper.get('[data-test="list-empty"]').text()).toContain('Your list is empty.')
    expect(wrapper.get('[data-test="list-empty"]').text()).toContain('Add a show with the + button on any show page.')
    expect(wrapper.find('[data-test="list-grid"]').exists()).toBe(false)
  })

  it('shows a card for every saved show', () => {
    const pinia = createPinia()

    useListStore(pinia).add(makeShow({ id: 1, name: 'Under the Dome' }))
    useListStore(pinia).add(makeShow({ id: 2, name: 'Lost' }))
    wrapper = mountWrapper(pinia)

    expect(wrapper.find('[data-test="list-empty"]').exists()).toBe(false)
    expect(wrapper.get('[data-test="show-card-1"]').text()).toContain('Under the Dome')
    expect(wrapper.get('[data-test="show-card-2"]').text()).toContain('Lost')
  })

  it('drops a show from the grid when it leaves the list', async () => {
    const pinia = createPinia()
    const list = useListStore(pinia)

    list.add(makeShow({ id: 1 }))
    wrapper = mountWrapper(pinia)

    list.remove(1)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-test="show-card-1"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="list-empty"]').exists()).toBe(true)
  })
})
