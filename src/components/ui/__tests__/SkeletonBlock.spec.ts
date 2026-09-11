import { it, expect, describe } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import SkeletonBlock from '@/components/ui/SkeletonBlock.vue'

type Props = InstanceType<typeof SkeletonBlock>['$props']

let wrapper: VueWrapper<any>

function mountWrapper(props?: Props) {
  return mount(SkeletonBlock, { props: props ?? {} })
}

describe('SkeletonBlock', () => {
  it('fills the width of its container by default', () => {
    wrapper = mountWrapper()

    expect(wrapper.get('[data-test="skeleton-span"]').attributes('style')).toBe('width: 100%; height: 12px;')
  })

  it('takes the size it is given', () => {
    wrapper = mountWrapper({ width: '160px', height: '24px' })

    expect(wrapper.get('[data-test="skeleton-span"]').attributes('style')).toBe('width: 160px; height: 24px;')
  })
})
