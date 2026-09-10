import { createPinia } from 'pinia'
import { apiGet } from '@/utils/api'
import GenresView from '@/views/GenresView.vue'
import { testPlugins } from '@/__tests__/setup.ts'
import { mount, flushPromises } from '@vue/test-utils'
import { vi, it, expect, describe, beforeEach } from 'vitest'

vi.mock('@/utils/api', () => ({ apiGet: vi.fn(), toQuery: vi.fn(() => '') }))

const apiGetMock = vi.mocked(apiGet)

async function mountView() {
  const wrapper = mount(GenresView, { global: { plugins: testPlugins(createPinia()) } })

  await flushPromises()

  return wrapper
}

describe('GenresView', () => {
  beforeEach(() => {
    apiGetMock.mockReset()
    apiGetMock.mockResolvedValue([
      { name: 'Drama', slug: 'drama', total: 120 },
      { name: 'Talk Show', slug: 'talk-show', total: 1 }
    ])
  })

  it('asks for the genres when it opens', async () => {
    await mountView()

    expect(apiGetMock).toHaveBeenCalledWith('/genres')
  })

  it('is titled Browse genres', async () => {
    expect((await mountView()).get('[data-test="genres-view"]').text()).toContain('Browse genres')
  })

  it('shows a tile with the size of every genre', async () => {
    const wrapper = await mountView()

    expect(wrapper.get('[data-test="genre-tile-drama"]').text()).toContain('Drama')
    expect(wrapper.get('[data-test="genre-tile-drama"]').text()).toContain('120 shows')
    expect(wrapper.get('[data-test="genre-tile-talk-show"]').text()).toContain('1 show')
  })

  it('links every tile to its genre page', async () => {
    const wrapper = await mountView()

    expect(wrapper.get('[data-test="genre-tile-drama"]').attributes('href')).toBe('/genres/drama')
  })
})
