import { resolve } from 'node:path'
import { readFileSync } from 'node:fs'
import { mount } from '@vue/test-utils'
import type { IconName } from '@/models'
import { ICON_PATHS } from '@/utils/icons'
import { it, expect, describe } from 'vitest'
import AppIcon from '@/components/ui/AppIcon.vue'

const SHAPES = /<(?:path|circle|line)[\s>]/g

const names = Object.keys(ICON_PATHS) as IconName[]
const entries = names.map((name): [IconName, string] => [name, ICON_PATHS[name]])

function declaredNames(): string[] {
  const source = readFileSync(resolve(process.cwd(), 'src/models/icon.ts'), 'utf8')
  const union = source.match(/type IconName =([\s\S]*?)\n\s*\n/)?.[1] ?? ''

  return [...union.matchAll(/'([^']+)'/g)].flatMap((match) => match[1] ?? [])
}

function shapeCount(markup: string): number {
  return markup.match(SHAPES)?.length ?? 0
}

describe('ICON_PATHS', () => {
  it('has one entry for every declared icon name and no extras', () => {
    const declared = declaredNames()

    expect(declared.length).toBeGreaterThan(0)
    expect([...names].sort()).toEqual([...declared].sort())
  })

  it.each(entries)('keeps %s as drawable inner markup', (_name, markup) => {
    expect(markup).toBeTypeOf('string')
    expect(markup.length).toBeGreaterThan(0)
    expect(shapeCount(markup)).toBeGreaterThan(0)
  })

  it.each(entries)('strips the wrapper and the licence comment from %s', (_name, markup) => {
    expect(markup).not.toContain('<svg')
    expect(markup).not.toContain('</svg')
    expect(markup).not.toContain('<!--')
    expect(markup).not.toContain('\n')
  })

  it('gives every icon name its own shape', () => {
    const markup = entries.map(([, value]) => value)

    expect(new Set(markup).size).toBe(markup.length)
  })
})

describe('ICON_PATHS in the DOM', () => {
  it.each(entries)('draws %s inside the AppIcon wrapper', (name, markup) => {
    const wrapper = mount(AppIcon, { props: { name } })

    expect(wrapper.element.children.length).toBeGreaterThan(0)
    expect(wrapper.findAll('path, circle, line')).toHaveLength(shapeCount(markup))
  })
})
