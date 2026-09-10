import { mount } from '@vue/test-utils'
import { it, expect, describe } from 'vitest'
import PosterImage from '@/components/ui/PosterImage.vue'

describe('PosterImage', () => {
  it('renders the poster when there is an image', () => {
    const wrapper = mount(PosterImage, { props: { src: 'https://img/poster.jpg', alt: 'Under the Dome' } })
    const image = wrapper.get('img')

    expect(image.attributes('src')).toBe('https://img/poster.jpg')
    expect(image.attributes('alt')).toBe('Under the Dome')
    expect(wrapper.find('[data-test="poster-fallback-span"]').exists()).toBe(false)
  })

  it('falls back to the first letter of the title when there is no image', () => {
    const wrapper = mount(PosterImage, { props: { src: null, alt: 'under the dome' } })

    expect(wrapper.get('[data-test="poster-fallback-span"]').text()).toBe('U')
    expect(wrapper.find('img').exists()).toBe(false)
  })

  it('falls back when the image fails to load', async () => {
    const wrapper = mount(PosterImage, { props: { src: 'https://img/broken.jpg', alt: 'Lost' } })

    await wrapper.get('img').trigger('error')

    expect(wrapper.get('[data-test="poster-fallback-span"]').text()).toBe('L')
    expect(wrapper.find('img').exists()).toBe(false)
  })

  it('tries again when a new image is given', async () => {
    const wrapper = mount(PosterImage, { props: { src: 'https://img/broken.jpg', alt: 'Lost' } })

    await wrapper.get('img').trigger('error')
    await wrapper.setProps({ src: 'https://img/other.jpg' })

    expect(wrapper.get('img').attributes('src')).toBe('https://img/other.jpg')
  })

  it('supports the still ratio used by episode thumbnails', () => {
    const wrapper = mount(PosterImage, { props: { src: null, alt: 'Pilot', ratio: 'still' } })

    expect(wrapper.get('[data-test="poster-div"]').classes()).toContain('poster--still')
  })
})
