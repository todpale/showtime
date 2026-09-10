import { vi } from 'vitest'
import { i18n } from '@/locales'
import type { Pinia } from 'pinia'
import { createPinia } from 'pinia'
import { defineComponent } from 'vue'
import type { Plugin, Component } from 'vue'
import type { Router, RouteRecordRaw } from 'vue-router'
import { createRouter, createMemoryHistory } from 'vue-router'

const RouteStub = defineComponent({ name: 'RouteStub', template: '<div data-test="route-stub" />' })

function createRoutes(home: Component): RouteRecordRaw[] {
  return [
    { path: '/', name: 'home', component: home },
    { path: '/search', name: 'search', component: RouteStub },
    { path: '/genres', name: 'genres', component: RouteStub },
    { path: '/genres/:slug', name: 'genre', component: RouteStub },
    { path: '/shows/:id', name: 'show', component: RouteStub },
    { path: '/list', name: 'list', component: RouteStub }
  ]
}

function createTestRouter(home: Component = RouteStub): Router {
  return createRouter({ history: createMemoryHistory(), routes: createRoutes(home) })
}

function testPlugins(pinia: Pinia = createPinia(), router: Router = createTestRouter()): Plugin[] {
  return [i18n as unknown as Plugin, pinia, router]
}

function stubMatchMedia(matches: boolean): void {
  vi.stubGlobal('matchMedia', (media: string) => ({
    media,
    matches,
    addEventListener: () => undefined,
    removeEventListener: () => undefined
  }))
}

export { testPlugins, stubMatchMedia, createTestRouter }
