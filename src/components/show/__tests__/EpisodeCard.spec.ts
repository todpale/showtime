import type { Episode } from '@/models'
import { it, expect, describe } from 'vitest'
import { testPlugins } from '@/__tests__/setup.ts'
import { makeEpisode } from '@/__tests__/fixtures'
import { mount, type VueWrapper } from '@vue/test-utils'
import EpisodeCard from '@/components/show/EpisodeCard.vue'

let wrapper: VueWrapper<any>

function mountWrapper(episode: Episode, extra: { active?: boolean, selectable?: boolean } = {}) {
  return mount(EpisodeCard, { props: { episode, ...extra }, global: { plugins: testPlugins() } })
}

describe('EpisodeCard', () => {
  it('is identified by the episode number', () => {
    wrapper = mountWrapper(makeEpisode({ number: 4 }))

    expect(wrapper.find('[data-test="episode-card-4"]').exists()).toBe(true)
  })

  it('falls back to zero for an unnumbered episode', () => {
    wrapper = mountWrapper(makeEpisode({ number: null }))

    expect(wrapper.find('[data-test="episode-card-0"]').exists()).toBe(true)
  })

  it('shows the title and the summary', () => {
    wrapper = mountWrapper(makeEpisode({ name: 'The Fire', summary: 'A house burns down.' }))

    expect(wrapper.text()).toContain('The Fire')
    expect(wrapper.text()).toContain('A house burns down.')
  })

  it('shows the season code and the runtime', () => {
    wrapper = mountWrapper(makeEpisode({ season: 2, number: 5, runtime: 42 }))

    expect(wrapper.text()).toContain('S2:E5 · 42m')
  })

  it('leaves out the runtime when the episode has none', () => {
    wrapper = mountWrapper(makeEpisode({ season: 1, number: 1, runtime: null }))

    expect(wrapper.get('.episode__eyebrow').text()).toBe('S1:E1')
  })

  it('is a button that reports a selection', async () => {
    wrapper = mountWrapper(makeEpisode({ number: 1 }))

    await wrapper.get('[data-test="episode-card-1"]').trigger('click')

    expect(wrapper.emitted('on-select')).toHaveLength(1)
  })

  it('is a plain block that cannot be selected when selection is off', async () => {
    wrapper = mountWrapper(makeEpisode({ number: 1 }), { selectable: false })

    expect(wrapper.element.tagName).toBe('DIV')

    await wrapper.get('[data-test="episode-card-1"]').trigger('click')

    expect(wrapper.emitted('on-select')).toBeUndefined()
  })

  it('marks the episode that is playing', () => {
    wrapper = mountWrapper(makeEpisode({ number: 1 }), { active: true })
    expect(wrapper.classes()).toContain('episode--active')
  })
})
