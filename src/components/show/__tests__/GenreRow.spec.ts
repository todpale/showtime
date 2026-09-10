import { mount } from '@vue/test-utils'
import type { GenreRow } from '@/models'
import { it, expect, describe } from 'vitest'
import { makeShow } from '@/__tests__/fixtures'
import { testPlugins } from '@/__tests__/setup.ts'
import GenreRowComponent from '@/components/show/GenreRow.vue'

function makeRow(overrides: Partial<GenreRow> = {}): GenreRow {
  return {
    name: 'Drama',
    slug: 'drama',
    total: 120,
    shows: [makeShow({ id: 1, name: 'Under the Dome' }), makeShow({ id: 2, name: 'Person of Interest' })],
    ...overrides
  }
}

function mountRow(row: GenreRow) {
  return mount(GenreRowComponent, { props: { row }, global: { plugins: testPlugins() } })
}

describe('GenreRow', () => {
  it('is identified by the genre slug', () => {
    expect(mountRow(makeRow()).find('[data-test="genre-row-drama"]').exists()).toBe(true)
  })

  it('shows the genre name and how many shows it holds', () => {
    const wrapper = mountRow(makeRow())

    expect(wrapper.get('[data-test="genre-row-title"]').text()).toBe('Drama')
    expect(wrapper.text()).toContain('Top rated · 120 shows')
  })

  it('links to the full genre page', () => {
    expect(mountRow(makeRow()).get('[data-test="genre-row-see-all"]').attributes('href')).toBe('/genres/drama')
  })

  it('renders a card for every show in the row', () => {
    const wrapper = mountRow(makeRow())

    expect(wrapper.find('[data-test="show-card-1"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="show-card-2"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-test="show-card-title"]')).toHaveLength(2)
  })

  it('passes the row genre to its cards', () => {
    const wrapper = mountRow(makeRow({ name: 'Comedy', shows: [makeShow({ id: 1, year: 2013 })] }))

    expect(wrapper.get('[data-test="show-card-meta"]').text()).toBe('Comedy · 2013')
  })

  it('renders no cards for an empty row', () => {
    expect(mountRow(makeRow({ shows: [] })).findAll('[data-test="show-card-title"]')).toHaveLength(0)
  })
})
