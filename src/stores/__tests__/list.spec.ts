import { useListStore } from '@/stores/list'
import { makeShow } from '@/__tests__/fixtures'
import { createPinia, setActivePinia } from 'pinia'
import { it, expect, describe, beforeEach } from 'vitest'

const KEY = 'showtime.my-list'

describe('list store', () => {
  beforeEach(() => {
    window.localStorage.clear()
    setActivePinia(createPinia())
  })

  it('starts empty when nothing was saved before', () => {
    const list = useListStore()

    expect(list.shows).toEqual([])
    expect(list.count).toBe(0)
  })

  it('restores the shows saved in a previous session', () => {
    window.localStorage.setItem(KEY, JSON.stringify([makeShow({ id: 7 })]))

    const list = useListStore()

    expect(list.count).toBe(1)
    expect(list.has(7)).toBe(true)
  })

  it('ignores a corrupted saved list', () => {
    window.localStorage.setItem(KEY, 'not json')

    expect(useListStore().shows).toEqual([])
  })

  it('adds a show and persists it', () => {
    const list = useListStore()

    list.add(makeShow({ id: 7, name: 'Person of Interest' }))

    expect(list.has(7)).toBe(true)
    expect(list.count).toBe(1)
    expect(window.localStorage.getItem(KEY)).toContain('Person of Interest')
  })

  it('does not add the same show twice', () => {
    const list = useListStore()

    list.add(makeShow({ id: 7 }))
    list.add(makeShow({ id: 7 }))

    expect(list.count).toBe(1)
  })

  it('removes a show and persists the change', () => {
    const list = useListStore()

    list.add(makeShow({ id: 7 }))
    list.add(makeShow({ id: 8 }))
    list.remove(7)

    expect(list.has(7)).toBe(false)
    expect(list.shows.map((show) => show.id)).toEqual([8])
    expect(window.localStorage.getItem(KEY)).toBe(JSON.stringify(list.shows))
  })

  it('ignores a removal of a show that is not in the list', () => {
    const list = useListStore()

    list.add(makeShow({ id: 7 }))
    list.remove(99)

    expect(list.count).toBe(1)
  })

  it('toggles a show in and back out of the list', () => {
    const list = useListStore()
    const show = makeShow({ id: 7 })

    list.toggle(show)

    expect(list.has(7)).toBe(true)

    list.toggle(show)

    expect(list.has(7)).toBe(false)
    expect(window.localStorage.getItem(KEY)).toBe('[]')
  })

  it('survives a reload of the store', () => {
    useListStore().add(makeShow({ id: 7 }))

    setActivePinia(createPinia())

    expect(useListStore().has(7)).toBe(true)
  })
})
