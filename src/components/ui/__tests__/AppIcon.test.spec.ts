import { it, expect, describe } from 'vitest'
import AppIcon from '@/components/ui/AppIcon.vue'
import { mount, type VueWrapper } from '@vue/test-utils'

type Props = InstanceType<typeof AppIcon>['$props']

let wrapper: VueWrapper<any>

function mountWrapper(props: Props) {
  return mount(AppIcon, { props })
}

describe('AppIcon', () => {
  it('draws the shape of the icon it is asked for', () => {
    wrapper = mountWrapper({ name: 'search' })

    expect(wrapper.findAll('circle')).toHaveLength(1)
    expect(wrapper.get('path').attributes('d')).toBe('m21 21-4.34-4.34')
  })

  it('draws a different shape for a different name', () => {
    wrapper = mountWrapper({ name: 'x' })
    expect(wrapper.findAll('path')).toHaveLength(2)
  })

  it('is hidden from screen readers', () => {
    wrapper = mountWrapper({ name: 'search' })

    expect(wrapper.attributes('aria-hidden')).toBe('true')
    expect(wrapper.attributes('focusable')).toBe('false')
  })

  it('is 16 pixels unless a size is given', () => {
    wrapper = mountWrapper({ name: 'x' })
    expect(wrapper.attributes('width')).toBe('16')
  })

  it('is outlined by default and filled on request', () => {
    const outlined = mountWrapper({ name: 'star' })
    const filled = mountWrapper({ name: 'star', filled: true })

    expect(outlined.attributes('stroke')).toBe('currentColor')
    expect(outlined.attributes('fill')).toBe('none')
    expect(filled.attributes('fill')).toBe('currentColor')
    expect(filled.attributes('stroke')).toBe('none')
  })
})
