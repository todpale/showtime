import { mount } from '@vue/test-utils'
import { it, expect, describe } from 'vitest'
import AppIcon from '@/components/ui/AppIcon.vue'
import SkeletonBlock from '@/components/ui/SkeletonBlock.vue'

describe('AppIcon', () => {
  it('draws the shape of the icon it is asked for', () => {
    const search = mount(AppIcon, { props: { name: 'search' } })

    expect(search.findAll('circle')).toHaveLength(1)
    expect(search.get('path').attributes('d')).toBe('m21 21-4.34-4.34')
  })

  it('draws a different shape for a different name', () => {
    expect(mount(AppIcon, { props: { name: 'x' } }).findAll('path')).toHaveLength(2)
  })

  it('is hidden from screen readers', () => {
    const icon = mount(AppIcon, { props: { name: 'search' } })

    expect(icon.attributes('aria-hidden')).toBe('true')
    expect(icon.attributes('focusable')).toBe('false')
  })

  it('is 16 pixels unless a size is given', () => {
    expect(mount(AppIcon, { props: { name: 'x' } }).attributes('width')).toBe('16')
    expect(mount(AppIcon, { props: { name: 'x', size: 22 } }).attributes('height')).toBe('22')
  })

  it('is outlined by default and filled on request', () => {
    const outlined = mount(AppIcon, { props: { name: 'star' } })
    const filled = mount(AppIcon, { props: { name: 'star', filled: true } })

    expect(outlined.attributes('stroke')).toBe('currentColor')
    expect(outlined.attributes('fill')).toBe('none')
    expect(filled.attributes('fill')).toBe('currentColor')
    expect(filled.attributes('stroke')).toBe('none')
  })
})

describe('SkeletonBlock', () => {
  it('fills the width of its container by default', () => {
    const skeleton = mount(SkeletonBlock).get('[data-test="skeleton-span"]')

    expect(skeleton.attributes('style')).toBe('width: 100%; height: 12px;')
  })

  it('takes the size it is given', () => {
    const skeleton = mount(SkeletonBlock, { props: { width: '160px', height: '24px' } })

    expect(skeleton.get('[data-test="skeleton-span"]').attributes('style')).toBe('width: 160px; height: 24px;')
  })
})
