import { mount } from '@vue/test-utils'
import type { ShowSummary } from '@/models'
import { it, expect, describe } from 'vitest'
import { makeShow } from '@/__tests__/fixtures'
import { testPlugins } from '@/__tests__/setup.ts'
import ShowCard from '@/components/show/ShowCard.vue'

function mountCard(show: ShowSummary, genre?: string) {
  return mount(ShowCard, {
    props: { show, ...(genre === undefined ? {} : { genre }) },
    global: { plugins: testPlugins() }
  })
}

describe('ShowCard', () => {
  it('is identified by the id of the show', () => {
    const wrapper = mountCard(makeShow({ id: 42 }))

    expect(wrapper.find('[data-test="show-card-42"]').exists()).toBe(true)
  })

  it('shows the title of the show', () => {
    const wrapper = mountCard(makeShow({ name: 'Person of Interest' }))

    expect(wrapper.get('[data-test="show-card-title"]').text()).toBe('Person of Interest')
  })

  it('links to the show page', () => {
    expect(mountCard(makeShow({ id: 42 })).get('a').attributes('href')).toBe('/shows/42')
  })

  it('shows the row genre and the year as meta', () => {
    const wrapper = mountCard(makeShow({ year: 2013 }), 'Drama')

    expect(wrapper.get('[data-test="show-card-meta"]').text()).toBe('Drama · 2013')
  })

  it('falls back to the first genre of the show when no row genre is given', () => {
    const wrapper = mountCard(makeShow({ genres: ['Thriller', 'Crime'], year: 2011 }))

    expect(wrapper.get('[data-test="show-card-meta"]').text()).toBe('Thriller · 2011')
  })

  it('falls back to the type when the show has no genres', () => {
    const wrapper = mountCard(makeShow({ genres: [], type: 'Documentary', year: 2011 }))

    expect(wrapper.get('[data-test="show-card-meta"]').text()).toBe('Documentary · 2011')
  })

  it('leaves out a missing year', () => {
    const wrapper = mountCard(makeShow({ year: null }), 'Drama')

    expect(wrapper.get('[data-test="show-card-meta"]').text()).toBe('Drama')
  })

  it('shows the rating of the show', () => {
    expect(mountCard(makeShow({ rating: 8.4 })).get('[data-test="show-card-rating"]').text()).toBe('8.4')
  })

  it('shows an em dash for an unrated show', () => {
    expect(mountCard(makeShow({ rating: null })).get('[data-test="show-card-rating"]').text()).toBe('—')
  })

  it('shows the poster of the show', () => {
    const wrapper = mountCard(makeShow({ poster: 'https://img/poster.jpg', name: 'Lost' }))

    expect(wrapper.get('img').attributes('src')).toBe('https://img/poster.jpg')
    expect(wrapper.get('img').attributes('alt')).toBe('Lost')
  })
})
