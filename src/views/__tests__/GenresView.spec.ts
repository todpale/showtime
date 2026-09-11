import { createPinia } from 'pinia'
import { apiGet } from '@/utils/api'
import GenresView from '@/views/GenresView.vue'
import { testPlugins } from '@/__tests__/setup.ts'
import { vi, it, expect, describe, beforeEach } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'

vi.mock('@/utils/api', () => ({ apiGet: vi.fn(), toQuery: vi.fn(() => '') }))

const apiGetMock = vi.mocked(apiGet)

let wrapper: VueWrapper<any>

async function mountWrapper() {
  const view = mount(GenresView, { global: { plugins: testPlugins(createPinia()) } })

  await flushPromises()

  return view
}

beforeEach(() => {
  apiGetMock.mockReset()
  apiGetMock.mockResolvedValue([
    { name: 'Drama', slug: 'drama', total: 120 },
    { name: 'Talk Show', slug: 'talk-show', total: 1 }
  ])

})

describe('GenresView', () => {
  it('asks for the genres when it opens', async () => {
    wrapper = await mountWrapper()
    expect(apiGetMock).toHaveBeenCalledWith('/genres')
  })

  it('is titled Browse genres', async () => {
    wrapper = await mountWrapper()
    expect(wrapper.get('[data-test="genres-view"]').text()).toContain('Browse genres')
  })

  it('shows a tile with the size of every genre', async () => {
    wrapper = await mountWrapper()

    expect(wrapper.get('[data-test="genre-tile-drama"]').text()).toContain('Drama')
    expect(wrapper.get('[data-test="genre-tile-drama"]').text()).toContain('120 shows')
    expect(wrapper.get('[data-test="genre-tile-talk-show"]').text()).toContain('1 show')
  })

  it('links every tile to its genre page', async () => {
    wrapper = await mountWrapper()
    expect(wrapper.get('[data-test="genre-tile-drama"]').attributes('href')).toBe('/genres/drama')
  })
})
