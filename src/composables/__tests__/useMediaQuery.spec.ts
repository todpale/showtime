import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { vi, it, expect, describe, afterEach } from 'vitest'
import { useDesktop, useMediaQuery } from '@/composables/useMediaQuery'

interface FakeList {
  media: string
  matches: boolean
  listeners: ((event: { matches: boolean }) => void)[]
  addEventListener: (type: string, listener: (event: { matches: boolean }) => void) => void
  removeEventListener: (type: string, listener: (event: { matches: boolean }) => void) => void
}

const lists: FakeList[] = []

function lastList(): FakeList | undefined {
  return lists[lists.length - 1]
}

function stubMatchMedia(matches: boolean): void {
  lists.length = 0

  vi.stubGlobal('matchMedia', (media: string) => {
    const list: FakeList = {
      media,
      matches,
      listeners: [],
      addEventListener: (type, listener) => {
        list.listeners.push(listener)
      },
      removeEventListener: (type, listener) => {
        list.listeners = list.listeners.filter((entry) => entry !== listener)
      }
    }

    lists.push(list)

    return list
  })
}

const Probe = defineComponent({
  props: {
    query: { type: String, default: '' },
    desktop: { type: Boolean, default: false }
  },
  setup(props) {
    return { matches: props.desktop ? useDesktop() : useMediaQuery(props.query) }
  },
  template: '<span data-test="matches-span">{{ matches }}</span>'
})

function mountWith(query: string) {
  return mount(Probe, { props: { query } })
}

describe('useMediaQuery', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reports the current match as soon as the component sets up', () => {
    stubMatchMedia(true)

    expect(mountWith('(min-width: 900px)').get('[data-test="matches-span"]').text()).toBe('true')
  })

  it('reports a non-matching query as false', () => {
    stubMatchMedia(false)

    expect(mountWith('(min-width: 900px)').get('[data-test="matches-span"]').text()).toBe('false')
  })

  it('updates when the media query starts matching', async () => {
    stubMatchMedia(false)

    const wrapper = mountWith('(min-width: 900px)')
    const list = lastList()

    list?.listeners.forEach((listener) => listener({ matches: true }))
    await wrapper.vm.$nextTick()

    expect(wrapper.get('[data-test="matches-span"]').text()).toBe('true')
  })

  it('stops listening once the component is unmounted', () => {
    stubMatchMedia(false)

    const wrapper = mountWith('(min-width: 900px)')
    const list = lastList()

    expect(list?.listeners).toHaveLength(1)

    wrapper.unmount()

    expect(list?.listeners).toHaveLength(0)
  })
})

describe('useDesktop', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('watches the 900px desktop breakpoint', () => {
    stubMatchMedia(true)

    mount(Probe, { props: { desktop: true } })

    expect(lastList()?.media).toBe('(min-width: 900px)')
  })
})
