import { mount } from '@vue/test-utils'
import type { Episode } from '@/models'
import { ref, defineComponent } from 'vue'
import { testPlugins } from '@/__tests__/setup.ts'
import { makeEpisode } from '@/__tests__/fixtures'
import { vi, it, expect, describe, afterEach } from 'vitest'
import EpisodeModal from '@/components/show/EpisodeModal.vue'

function mountModal(episode: Episode = makeEpisode()) {
  return mount(EpisodeModal, {
    props: { episode },
    attachTo: document.body,
    global: { plugins: testPlugins() }
  })
}

function pressKey(key: string): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { key }))
}

function mountHost() {
  const open = ref(true)
  const onClose = vi.fn()
  const episode = makeEpisode()

  const host = defineComponent({
    name: 'ModalHost',
    components: { EpisodeModal },
    setup: () => ({ open, episode, onClose }),
    template: '<episode-modal v-if="open" :episode @on-close="onClose" />'
  })

  const wrapper = mount(host, { attachTo: document.body, global: { plugins: testPlugins() } })

  return { open, onClose, wrapper }
}

describe('EpisodeModal', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('names the episode in its title', () => {
    const wrapper = mountModal(makeEpisode({ name: 'The Fire' }))

    expect(wrapper.get('[data-test="episode-modal-title"]').text()).toBe('The Fire')

    wrapper.unmount()
  })

  it('shows the season code and the runtime', () => {
    const wrapper = mountModal(makeEpisode({ season: 2, number: 5, runtime: 42 }))

    expect(wrapper.get('[data-test="episode-modal-code"]').text()).toBe('S2:E5 · 42m')

    wrapper.unmount()
  })

  it('leaves out the runtime when the episode has none', () => {
    const wrapper = mountModal(makeEpisode({ season: 1, number: 1, runtime: null }))

    expect(wrapper.get('[data-test="episode-modal-code"]').text()).toBe('S1:E1')

    wrapper.unmount()
  })

  it('falls back to the first episode number when the episode is unnumbered', () => {
    const wrapper = mountModal(makeEpisode({ season: 3, number: null, runtime: null }))

    expect(wrapper.get('[data-test="episode-modal-code"]').text()).toBe('S3:E1')

    wrapper.unmount()
  })

  it('lists the air date and the rating with one decimal', () => {
    const wrapper = mountModal(makeEpisode({ airdate: '2013-06-24', rating: 8 }))

    expect(wrapper.get('[data-test="episode-modal-airdate"]').text()).toBe('2013-06-24')
    expect(wrapper.get('[data-test="episode-modal-rating"]').text()).toBe('8.0')

    wrapper.unmount()
  })

  it('hides the air date when the episode never aired', () => {
    const wrapper = mountModal(makeEpisode({ airdate: null }))

    expect(wrapper.find('[data-test="episode-modal-airdate"]').exists()).toBe(false)

    wrapper.unmount()
  })

  it('hides the rating when the episode has none', () => {
    const wrapper = mountModal(makeEpisode({ rating: null }))

    expect(wrapper.find('[data-test="episode-modal-rating"]').exists()).toBe(false)

    wrapper.unmount()
  })

  it('shows the summary and hides it when there is nothing to read', () => {
    const withText = mountModal(makeEpisode({ summary: 'The dome comes down.' }))
    const withoutText = mountModal(makeEpisode({ summary: '' }))

    expect(withText.get('[data-test="episode-modal-summary"]').text()).toBe('The dome comes down.')
    expect(withoutText.find('[data-test="episode-modal-summary"]').exists()).toBe(false)

    withText.unmount()
    withoutText.unmount()
  })

  it('asks the page to close from the close button', async () => {
    const wrapper = mountModal()

    await wrapper.get('[data-test="episode-modal-close-btn"]').trigger('click')

    expect(wrapper.emitted('on-close')).toHaveLength(1)

    wrapper.unmount()
  })

  it('asks the page to close from the scrim behind the panel', async () => {
    const wrapper = mountModal()

    await wrapper.get('[data-test="episode-modal-scrim-btn"]').trigger('click')

    expect(wrapper.emitted('on-close')).toHaveLength(1)

    wrapper.unmount()
  })

  it('asks the page to close when Escape is pressed', () => {
    const wrapper = mountModal()

    pressKey('Escape')

    expect(wrapper.emitted('on-close')).toHaveLength(1)

    wrapper.unmount()
  })

  it('stays open on any other key', () => {
    const wrapper = mountModal()

    pressKey('Enter')
    pressKey('a')

    expect(wrapper.emitted('on-close')).toBeUndefined()

    wrapper.unmount()
  })

  it('stops listening for Escape once it is gone', async () => {
    const { open, onClose, wrapper } = mountHost()

    pressKey('Escape')

    expect(onClose).toHaveBeenCalledTimes(1)

    open.value = false
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-test="episode-modal"]').exists()).toBe(false)

    pressKey('Escape')

    expect(onClose).toHaveBeenCalledTimes(1)

    wrapper.unmount()
  })

  it('leaves no keydown listener behind on the window', () => {
    const added = vi.spyOn(window, 'addEventListener')
    const removed = vi.spyOn(window, 'removeEventListener')

    const wrapper = mountModal()

    const registrations = added.mock.calls.filter(([type]) => type === 'keydown')

    expect(registrations).toHaveLength(1)

    wrapper.unmount()

    const removals = removed.mock.calls.filter(([type]) => type === 'keydown')

    expect(removals).toHaveLength(1)
    expect(removals[0]?.[1]).toBe(registrations[0]?.[1])
  })

  it('moves the focus onto the close button so the keyboard starts inside the dialog', async () => {
    const wrapper = mountModal()

    await wrapper.vm.$nextTick()

    expect(document.activeElement).toBe(wrapper.get('[data-test="episode-modal-close-btn"]').element)

    wrapper.unmount()
  })

  it('announces itself as a modal dialog labelled by its title', () => {
    const wrapper = mountModal()

    const panel = wrapper.get('[role="dialog"]')
    const title = wrapper.get('[data-test="episode-modal-title"]')

    expect(panel.attributes('aria-modal')).toBe('true')
    expect(panel.attributes('aria-labelledby')).toBe(title.attributes('id'))

    wrapper.unmount()
  })

  it('offers no way to watch the episode', () => {
    const wrapper = mountModal()

    expect(wrapper.find('[data-test*="play"]').exists()).toBe(false)
    expect(wrapper.find('[data-test*="watch"]').exists()).toBe(false)
    expect(wrapper.find('[data-test*="download"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Watch now')
    expect(wrapper.text()).not.toContain('Download')

    wrapper.unmount()
  })
})
