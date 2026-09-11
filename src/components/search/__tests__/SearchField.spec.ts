import { testPlugins } from '@/__tests__/setup.ts'
import { mount, type VueWrapper } from '@vue/test-utils'
import { it, expect, describe, beforeEach } from 'vitest'
import SearchField from '@/components/search/SearchField.vue'

let wrapper: VueWrapper<any>

function mountWrapper(modelValue = '') {
  return mount(SearchField, {
    props: { modelValue },
    attachTo: document.body,
    global: { plugins: testPlugins() }
  })
}

beforeEach(() => {
  wrapper = mountWrapper()
})

describe('SearchField', () => {
  it('shows the current query', () => {
    const input = mountWrapper('dome').get('[data-test="search-input"]')
    expect((input.element as HTMLInputElement).value).toBe('dome')
  })

  it('invites the viewer to search', () => {
    const input = mountWrapper().get('[data-test="search-input"]')
    expect(input.attributes('placeholder')).toBe('Search shows by name')
    expect(input.attributes('aria-label')).toBe('Search shows by name')
  })

  it('reports what the viewer types', async () => {
    wrapper.vm.tempModel = 'dome'
    expect(wrapper.emitted('update:modelValue')).toEqual([['dome']])
  })

  it('takes the focus so the viewer can type straight away', () => {
    expect(document.activeElement).toBe(wrapper.get('[data-test="search-input"]').element)
  })

  it('offers no clear button while the field is empty', () => {
    expect(wrapper.find('[data-test="search-clear-btn"]').exists()).toBe(false)
  })

  it('asks the page to clear the query', async () => {
    wrapper = mountWrapper('dome')
    await wrapper.get('[data-test="search-clear-btn"]').trigger('click')
    expect(wrapper.emitted('on-clear')).toHaveLength(1)
  })

  it('gives the focus back to the field after clearing', async () => {
    wrapper = mountWrapper('dome')
    await wrapper.get('[data-test="search-clear-btn"]').trigger('click')
    expect(document.activeElement).toBe(wrapper.get('[data-test="search-input"]').element)
  })
})
