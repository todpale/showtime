import type { ShowSummary } from '@/models'
import { it, expect, describe } from 'vitest'
import { makeShow } from '@/__tests__/fixtures'
import { testPlugins } from '@/__tests__/setup.ts'
import ShowCard from '@/components/show/ShowCard.vue'
import { mount, type VueWrapper } from '@vue/test-utils'

let wrapper: VueWrapper<any>

function mountWrapper(show: ShowSummary, genre?: string) {
  return mount(ShowCard, {
    props: { show, ...(genre === undefined ? {} : { genre }) },
    global: { plugins: testPlugins() }
  })
}

describe('ShowCard', () => {
  it('is identified by the id of the show', () => {
    wrapper = mountWrapper(makeShow({ id: 42 }))

    expect(wrapper.find('[data-test="show-card-42"]').exists()).toBe(true)
  })

  it('shows the title of the show', () => {
    wrapper = mountWrapper(makeShow({ name: 'Person of Interest' }))

    expect(wrapper.get('[data-test="show-card-title"]').text()).toBe('Person of Interest')
  })

  it('links to the show page', () => {
    wrapper = mountWrapper(makeShow({ id: 42 }))
    expect(wrapper.get('a').attributes('href')).toBe('/shows/42')
  })

  it('shows the row genre and the year as meta', () => {
    wrapper = mountWrapper(makeShow({ year: 2013 }), 'Drama')

    expect(wrapper.get('[data-test="show-card-meta"]').text()).toBe('Drama · 2013')
  })

  it('falls back to the first genre of the show when no row genre is given', () => {
    wrapper = mountWrapper(makeShow({ genres: ['Thriller', 'Crime'], year: 2011 }))

    expect(wrapper.get('[data-test="show-card-meta"]').text()).toBe('Thriller · 2011')
  })

  it('falls back to the type when the show has no genres', () => {
    wrapper = mountWrapper(makeShow({ genres: [], type: 'Documentary', year: 2011 }))

    expect(wrapper.get('[data-test="show-card-meta"]').text()).toBe('Documentary · 2011')
  })

  it('leaves out a missing year', () => {
    wrapper = mountWrapper(makeShow({ year: null }), 'Drama')

    expect(wrapper.get('[data-test="show-card-meta"]').text()).toBe('Drama')
  })

  it('shows the rating of the show', () => {
    wrapper = mountWrapper(makeShow({ rating: 8.4 }))
    expect(wrapper.get('[data-test="show-card-rating"]').text()).toBe('8.4')
  })

  it('shows an em dash for an unrated show', () => {
    wrapper = mountWrapper(makeShow({ rating: null }))
    expect(wrapper.get('[data-test="show-card-rating"]').text()).toBe('—')
  })

  it('shows the poster of the show', () => {
    wrapper = mountWrapper(makeShow({ poster: 'https://img/poster.jpg', name: 'Lost' }))

    expect(wrapper.get('img').attributes('src')).toBe('https://img/poster.jpg')
    expect(wrapper.get('img').attributes('alt')).toBe('Lost')
  })
})
