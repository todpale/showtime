import { mount } from '@vue/test-utils'
import { vi, it, expect, describe } from 'vitest'
import AppChip from '@/components/ui/AppChip.vue'
import { testPlugins } from '@/__tests__/setup.ts'

describe('AppChip', () => {
  it('renders a button with its label', () => {
    const wrapper = mount(AppChip, {
      props: { label: 'Drama' },
      attrs: { 'data-test': 'genre-chip-drama' },
      global: { plugins: testPlugins() }
    })

    expect(wrapper.get('[data-test="genre-chip-drama"]').text()).toBe('Drama')
    expect(wrapper.element.tagName).toBe('BUTTON')
  })

  it('marks the active chip as pressed', () => {
    const wrapper = mount(AppChip, {
      props: { label: 'Drama', active: true },
      global: { plugins: testPlugins() }
    })

    expect(wrapper.attributes('aria-pressed')).toBe('true')
    expect(wrapper.classes()).toContain('chip--active')
  })

  it('passes the click on to the page', async () => {
    const onClick = vi.fn()
    const wrapper = mount(AppChip, {
      props: { label: 'Drama' },
      attrs: { onClick },
      global: { plugins: testPlugins() }
    })

    await wrapper.trigger('click')

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('renders a link when a route is given', () => {
    const wrapper = mount(AppChip, {
      props: { label: 'Drama', to: { name: 'genre', params: { slug: 'drama' } } },
      global: { plugins: testPlugins() }
    })

    expect(wrapper.get('a').attributes('href')).toBe('/genres/drama')
  })

  it('shows a dismiss icon when it can be removed', () => {
    const plain = mount(AppChip, { props: { label: 'Drama' }, global: { plugins: testPlugins() } })
    const dismissable = mount(AppChip, {
      props: { label: 'Drama', dismissable: true },
      global: { plugins: testPlugins() }
    })

    expect(plain.find('svg').exists()).toBe(false)
    expect(dismissable.find('svg').exists()).toBe(true)
  })
})
