import { mount } from '@vue/test-utils'
import type { Episode } from '@/models'
import { it, expect, describe } from 'vitest'
import { testPlugins } from '@/__tests__/setup.ts'
import { makeEpisode } from '@/__tests__/fixtures'
import EpisodeCard from '@/components/show/EpisodeCard.vue'

function mountCard(episode: Episode, extra: { active?: boolean, selectable?: boolean } = {}) {
  return mount(EpisodeCard, { props: { episode, ...extra }, global: { plugins: testPlugins() } })
}

describe('EpisodeCard', () => {
  it('is identified by the episode number', () => {
    const wrapper = mountCard(makeEpisode({ number: 4 }))

    expect(wrapper.find('[data-test="episode-card-4"]').exists()).toBe(true)
  })

  it('falls back to zero for an unnumbered episode', () => {
    const wrapper = mountCard(makeEpisode({ number: null }))

    expect(wrapper.find('[data-test="episode-card-0"]').exists()).toBe(true)
  })

  it('shows the title and the summary', () => {
    const wrapper = mountCard(makeEpisode({ name: 'The Fire', summary: 'A house burns down.' }))

    expect(wrapper.text()).toContain('The Fire')
    expect(wrapper.text()).toContain('A house burns down.')
  })

  it('shows the season code and the runtime', () => {
    const wrapper = mountCard(makeEpisode({ season: 2, number: 5, runtime: 42 }))

    expect(wrapper.text()).toContain('S2:E5 · 42m')
  })

  it('leaves out the runtime when the episode has none', () => {
    const wrapper = mountCard(makeEpisode({ season: 1, number: 1, runtime: null }))

    expect(wrapper.get('.episode__eyebrow').text()).toBe('S1:E1')
  })

  it('is a button that reports a selection', async () => {
    const wrapper = mountCard(makeEpisode({ number: 1 }))

    await wrapper.get('[data-test="episode-card-1"]').trigger('click')

    expect(wrapper.emitted('on-select')).toHaveLength(1)
  })

  it('is a plain block that cannot be selected when selection is off', async () => {
    const wrapper = mountCard(makeEpisode({ number: 1 }), { selectable: false })

    expect(wrapper.element.tagName).toBe('DIV')

    await wrapper.get('[data-test="episode-card-1"]').trigger('click')

    expect(wrapper.emitted('on-select')).toBeUndefined()
  })

  it('marks the episode that is playing', () => {
    expect(mountCard(makeEpisode({ number: 1 }), { active: true }).classes()).toContain('episode--active')
  })
})
