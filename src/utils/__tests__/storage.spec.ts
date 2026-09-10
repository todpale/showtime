import { readJson, writeJson } from '@/utils/storage'
import { vi, it, expect, describe, afterEach, beforeEach } from 'vitest'

describe('readJson', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('returns the fallback when the key was never written', () => {
    expect(readJson('showtime.missing', ['fallback'])).toEqual(['fallback'])
  })

  it('returns the stored value', () => {
    writeJson('showtime.my-list', [{ id: 1 }])

    expect(readJson<{ id: number }[]>('showtime.my-list', [])).toEqual([{ id: 1 }])
  })

  it('returns the fallback when the stored value is not valid json', () => {
    window.localStorage.setItem('showtime.broken', '{oops')

    expect(readJson('showtime.broken', 'safe')).toBe('safe')
  })

  it('returns the fallback when storage throws', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Access denied')
    })

    expect(readJson('showtime.my-list', [])).toEqual([])

    spy.mockRestore()
  })
})

describe('writeJson', () => {
  afterEach(() => {
    window.localStorage.clear()
  })

  it('stores the value as json', () => {
    writeJson('showtime.recent-searches', ['dome'])

    expect(window.localStorage.getItem('showtime.recent-searches')).toBe('["dome"]')
  })

  it('overwrites a previous value', () => {
    writeJson('showtime.recent-searches', ['dome'])
    writeJson('showtime.recent-searches', [])

    expect(readJson('showtime.recent-searches', ['unused'])).toEqual([])
  })

  it('warns instead of throwing when storage is unavailable', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Quota exceeded')
    })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    expect(() => writeJson('showtime.my-list', [1])).not.toThrow()
    expect(warn).toHaveBeenCalledWith('No localStorage is available in your browser')

    warn.mockRestore()
    spy.mockRestore()
  })
})
