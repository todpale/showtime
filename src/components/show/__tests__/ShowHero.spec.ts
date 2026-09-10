import type { ShowDetail } from '@/models'
import { makeDetail } from '@/__tests__/fixtures'
import ShowHero from '@/components/show/ShowHero.vue'
import { mount, flushPromises } from '@vue/test-utils'
import { testPlugins, stubMatchMedia } from '@/__tests__/setup.ts'
import { vi, it, expect, describe, afterEach, beforeEach } from 'vitest'

function mountHero(show: ShowDetail, saved = false) {
  return mount(ShowHero, { props: { show, saved }, global: { plugins: testPlugins() } })
}

function stubShare(share?: (data?: ShareData) => Promise<void>): void {
  vi.stubGlobal('navigator', share === undefined ? {} : { share })
}

function abortError(): Error {
  const error = new Error('The share was cancelled.')

  error.name = 'AbortError'

  return error
}

describe('ShowHero', () => {
  beforeEach(() => {
    stubMatchMedia(false)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows the title of the show', () => {
    expect(mountHero(makeDetail({ name: 'Under the Dome' })).get('[data-test="detail-title"]').text())
      .toBe('Under the Dome')
  })

  it('shows the summary of the show', () => {
    const wrapper = mountHero(makeDetail({ summary: 'A small town is sealed off by a dome.' }))

    expect(wrapper.get('[data-test="detail-summary"]').text()).toBe('A small town is sealed off by a dome.')
  })

  it('leaves out the summary when the show has none', () => {
    expect(mountHero(makeDetail({ summary: '' })).find('[data-test="detail-summary"]').exists()).toBe(false)
  })

  it('lines up the year, the seasons, the episodes, the status and the genres', () => {
    const wrapper = mountHero(makeDetail({
      year: 2013,
      status: 'Ended',
      genres: ['Drama'],
      seasonCount: 3,
      episodeCount: 39
    }))

    expect(wrapper.get('[data-test="detail-meta"]').text()).toBe('2013 · 3 seasons · 39 episodes · Ended · Drama')
  })

  it('lists at most three cast members as the starring line', () => {
    const wrapper = mountHero(makeDetail({
      cast: [1, 2, 3, 4].map((id) => ({ id, person: `Person ${id}`, character: `Role ${id}`, image: null }))
    }))

    expect(wrapper.get('[data-test="detail-starring"]').text()).toBe('Person 1, Person 2, Person 3')
  })

  it('leaves out the eyebrow when the show has no network', () => {
    const wrapper = mountHero(makeDetail({ network: null }))

    expect(wrapper.find('.hero__eyebrow').exists()).toBe(false)
  })

  it('skips the parts of the meta line that the show has no data for', () => {
    const wrapper = mountHero(makeDetail({
      year: null,
      status: 'Ended',
      genres: [],
      seasonCount: 0,
      episodeCount: 0
    }))

    expect(wrapper.get('[data-test="detail-meta"]').text()).toBe('Ended')
  })

  it('lists the creators of the show', () => {
    const wrapper = mountHero(makeDetail({ creators: ['Brian K. Vaughan'] }))

    expect(wrapper.get('[data-test="detail-creators"]').text()).toBe('Brian K. Vaughan')
  })

  it('asks the page to save, share and go back', async () => {
    const wrapper = mountHero(makeDetail())

    await wrapper.get('[data-test="detail-add-btn"]').trigger('click')
    await wrapper.get('[data-test="detail-share-btn"]').trigger('click')
    await wrapper.get('[data-test="detail-back-btn"]').trigger('click')

    expect(wrapper.emitted('on-save')).toHaveLength(1)
    expect(wrapper.emitted('on-share')).toHaveLength(1)
    expect(wrapper.emitted('on-back')).toHaveLength(1)
  })

  it('hands the whole payload to the native share sheet', async () => {
    const share = vi.fn<(data?: ShareData) => Promise<void>>().mockResolvedValue(undefined)

    stubShare(share)

    const wrapper = mountHero(makeDetail({ name: 'Under the Dome', summary: 'A small town is sealed off by a dome.' }))

    await wrapper.get('[data-test="detail-share-btn"]').trigger('click')
    await flushPromises()

    expect(share).toHaveBeenCalledWith({
      title: 'Under the Dome',
      url: window.location.href,
      text: 'A small town is sealed off by a dome.'
    })
    expect(wrapper.emitted('on-share')).toBeUndefined()
  })

  it('leaves the text out of the payload for a show without a summary', async () => {
    const share = vi.fn<(data?: ShareData) => Promise<void>>().mockResolvedValue(undefined)

    stubShare(share)

    const wrapper = mountHero(makeDetail({ name: 'Under the Dome', summary: '' }))

    await wrapper.get('[data-test="detail-share-btn"]').trigger('click')
    await flushPromises()

    expect(share).toHaveBeenCalledWith({ title: 'Under the Dome', url: window.location.href })
  })

  it('asks the page to share when the browser has no share sheet', async () => {
    stubShare()

    const wrapper = mountHero(makeDetail())

    await wrapper.get('[data-test="detail-share-btn"]').trigger('click')
    await flushPromises()

    expect(wrapper.emitted('on-share')).toHaveLength(1)
  })

  it('stays quiet when the visitor closes the native share sheet', async () => {
    const share = vi.fn<(data?: ShareData) => Promise<void>>().mockRejectedValue(abortError())

    stubShare(share)

    const wrapper = mountHero(makeDetail())

    await wrapper.get('[data-test="detail-share-btn"]').trigger('click')
    await flushPromises()

    expect(share).toHaveBeenCalledTimes(1)
    expect(wrapper.emitted('on-share')).toBeUndefined()
  })

  it('asks the page to share when the native share sheet fails', async () => {
    const share = vi.fn<(data?: ShareData) => Promise<void>>().mockRejectedValue(new Error('Not allowed.'))

    stubShare(share)

    const wrapper = mountHero(makeDetail())

    await wrapper.get('[data-test="detail-share-btn"]').trigger('click')
    await flushPromises()

    expect(wrapper.emitted('on-share')).toHaveLength(1)
  })

  it('marks the add button as pressed for a saved show', () => {
    const wrapper = mountHero(makeDetail(), true)

    expect(wrapper.get('[data-test="detail-add-btn"]').attributes('aria-pressed')).toBe('true')
  })

  it('marks the add button as not pressed for a show that is not saved', () => {
    const wrapper = mountHero(makeDetail())

    expect(wrapper.get('[data-test="detail-add-btn"]').attributes('aria-pressed')).toBe('false')
  })

  it('offers to add a show that is not saved to my list', () => {
    const wrapper = mountHero(makeDetail())

    expect(wrapper.get('[data-test="detail-add-btn"]').text()).toBe('Add to list')
  })

  it('shows a saved show as being in my list', () => {
    const wrapper = mountHero(makeDetail(), true)

    expect(wrapper.get('[data-test="detail-add-btn"]').text()).toBe('In My List')
  })

  it('highlights the add button only for a saved show', () => {
    expect(mountHero(makeDetail()).get('[data-test="detail-add-btn"]').classes()).toEqual(['hero__list'])
    expect(mountHero(makeDetail(), true).get('[data-test="detail-add-btn"]').classes())
      .toEqual(['hero__list', 'hero__list--active'])
  })

  it('leaves the naming of the add button to its own text', () => {
    const wrapper = mountHero(makeDetail())

    expect(wrapper.get('[data-test="detail-add-btn"]').attributes('aria-label')).toBeUndefined()
  })

  it('relabels the add button as soon as the show is saved', async () => {
    const wrapper = mountHero(makeDetail())

    await wrapper.setProps({ saved: true })

    const button = wrapper.get('[data-test="detail-add-btn"]')

    expect(button.text()).toBe('In My List')
    expect(button.classes()).toContain('hero__list--active')
    expect(button.attributes('aria-pressed')).toBe('true')
  })

  it('hides the side poster on a phone and shows it on a desktop', () => {
    expect(mountHero(makeDetail()).find('.hero__poster').exists()).toBe(false)

    stubMatchMedia(true)

    expect(mountHero(makeDetail()).find('.hero__poster').exists()).toBe(true)
  })
})
