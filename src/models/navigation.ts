import type { IconName } from './icon'

interface NavLink {
  name: string
  label: string
}

interface NavItem {
  name: string
  test: string
  label: string
  icon: IconName
}

export type { NavItem, NavLink }
