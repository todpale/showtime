import { mount } from '@vue/test-utils'
import { it, expect, describe } from 'vitest'
import { testPlugins } from '@/__tests__/setup.ts'
import SearchField from '@/components/search/SearchField.vue'

function mountField(modelValue = '') {
  return mount(SearchField, {
    props: { modelValue },
    attachTo: document.body,
    global: { plugins: testPlugins() }
  })
}

describe('SearchField', () => {
  it('shows the current query', () => {
    const input = mountField('dome').get('[data-test="search-input"]')

    expect((input.element as HTMLInputElement).value).toBe('dome')
  })

  it('invites the viewer to search', () => {
    const input = mountField().get('[data-test="search-input"]')

    expect(input.attributes('placeholder')).toBe('Search shows by name')
    expect(input.attributes('aria-label')).toBe('Search shows by name')
  })

  it('reports what the viewer types', async () => {
    const wrapper = mountField()

    await wrapper.get('[data-test="search-input"]').setValue('dome')

    expect(wrapper.emitted('update:modelValue')).toEqual([['dome']])
  })

  it('takes the focus so the viewer can type straight away', () => {
    const wrapper = mountField()

    expect(document.activeElement).toBe(wrapper.get('[data-test="search-input"]').element)

    wrapper.unmount()
  })

  it('offers no clear button while the field is empty', () => {
    expect(mountField().find('[data-test="search-clear-btn"]').exists()).toBe(false)
  })

  it('asks the page to clear the query', async () => {
    const wrapper = mountField('dome')

    await wrapper.get('[data-test="search-clear-btn"]').trigger('click')

    expect(wrapper.emitted('on-clear')).toHaveLength(1)
  })

  it('gives the focus back to the field after clearing', async () => {
    const wrapper = mountField('dome')

    await wrapper.get('[data-test="search-clear-btn"]').trigger('click')

    expect(document.activeElement).toBe(wrapper.get('[data-test="search-input"]').element)

    wrapper.unmount()
  })
})
