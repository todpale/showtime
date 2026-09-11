import { vi, it, expect, describe } from 'vitest'
import AppChip from '@/components/ui/AppChip.vue'
import { testPlugins } from '@/__tests__/setup.ts'
import { mount, type VueWrapper } from '@vue/test-utils'

type Props = InstanceType<typeof AppChip>['$props']

const onClickMock = vi.fn()

let wrapper: VueWrapper<any>

function mountWrapper(props: Props, attrs: Record<string, unknown> = {}) {
  return mount(AppChip, { props, attrs, global: { plugins: testPlugins() } })
}

describe('AppChip', () => {
  it('renders a button with its label', () => {
    wrapper = mountWrapper({ label: 'Drama' }, { 'data-test': 'genre-chip-drama' })

    expect(wrapper.get('[data-test="genre-chip-drama"]').text()).toBe('Drama')
    expect(wrapper.element.tagName).toBe('BUTTON')
  })

  it('marks the active chip as pressed', () => {
    wrapper = mountWrapper({ label: 'Drama', active: true })

    expect(wrapper.attributes('aria-pressed')).toBe('true')
    expect(wrapper.classes()).toContain('chip--active')
  })

  it('passes the click on to the page', async () => {
    wrapper = mountWrapper({ label: 'Drama' }, { onClick: onClickMock })

    await wrapper.trigger('click')

    expect(onClickMock).toHaveBeenCalledTimes(1)
  })

  it('renders a link when a route is given', () => {
    wrapper = mountWrapper({ label: 'Drama', to: { name: 'genre', params: { slug: 'drama' } } })

    expect(wrapper.get('a').attributes('href')).toBe('/genres/drama')
  })

  it('shows a dismiss icon when it can be removed', () => {
    const plain = mountWrapper({ label: 'Drama' })
    const dismissable = mountWrapper({ label: 'Drama', dismissable: true })

    expect(plain.find('svg').exists()).toBe(false)
    expect(dismissable.find('svg').exists()).toBe(true)
  })
})
