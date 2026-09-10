import { mount } from '@vue/test-utils'
import { it, expect, describe } from 'vitest'
import { testPlugins } from '@/__tests__/setup.ts'
import RatingPill from '@/components/ui/RatingPill.vue'

function mountPill(rating: number | null, size?: 'sm' | 'lg') {
  return mount(RatingPill, {
    props: { rating, ...(size ? { size } : {}) },
    global: { plugins: testPlugins() }
  })
}

describe('RatingPill', () => {
  it('shows the rating with one decimal', () => {
    expect(mountPill(8).get('[data-test="show-card-rating"]').text()).toBe('8.0')
  })

  it('shows an em dash when the show has no rating', () => {
    expect(mountPill(null).get('[data-test="show-card-rating"]').text()).toBe('—')
  })

  it('describes an unrated show for screen readers', () => {
    expect(mountPill(null).get('[data-test="show-card-rating"]').attributes('aria-label')).toBe('Not rated')
  })

  it('describes a rating out of ten for screen readers', () => {
    expect(mountPill(6.5).get('[data-test="show-card-rating"]').attributes('aria-label')).toBe('6.5 / 10')
  })

  it('renders a large variant on request', () => {
    expect(mountPill(7, 'lg').get('[data-test="show-card-rating"]').classes()).toContain('rating--lg')
  })
})
