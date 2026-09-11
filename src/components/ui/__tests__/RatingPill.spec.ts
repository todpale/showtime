import { it, expect, describe } from 'vitest'
import { testPlugins } from '@/__tests__/setup.ts'
import RatingPill from '@/components/ui/RatingPill.vue'
import { mount, type VueWrapper } from '@vue/test-utils'

let wrapper: VueWrapper<any>

function mountWrapper(rating: number | null, size?: 'sm' | 'lg') {
  return mount(RatingPill, {
    props: { rating, ...(size ? { size } : {}) },
    global: { plugins: testPlugins() }
  })
}

describe('RatingPill', () => {
  it('shows the rating with one decimal', () => {
    wrapper = mountWrapper(8)

    expect(wrapper.get('[data-test="show-card-rating"]').text()).toBe('8.0')
  })

  it('shows an em dash when the show has no rating', () => {
    wrapper = mountWrapper(null)

    expect(wrapper.get('[data-test="show-card-rating"]').text()).toBe('—')
  })

  it('describes an unrated show for screen readers', () => {
    wrapper = mountWrapper(null)

    expect(wrapper.get('[data-test="show-card-rating"]').attributes('aria-label')).toBe('Not rated')
  })

  it('describes a rating out of ten for screen readers', () => {
    wrapper = mountWrapper(6.5)

    expect(wrapper.get('[data-test="show-card-rating"]').attributes('aria-label')).toBe('6.5 / 10')
  })

  it('renders a large variant on request', () => {
    wrapper = mountWrapper(7, 'lg')

    expect(wrapper.get('[data-test="show-card-rating"]').classes()).toContain('rating--lg')
  })
})
