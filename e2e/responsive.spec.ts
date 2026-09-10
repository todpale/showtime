import { test, expect } from './fixtures'
import { box, VIEWPORTS, pageOverflowsHorizontally } from './fixtures/dom'

const WIDTHS = [360,
  582,
  899,
  900,
  1440,
  1920]
const SCREENS = ['/', '/search?q=bre', '/shows/1', '/genres/drama']
const POSTERS = 'a[data-test^="show-card-"] [data-test="poster-div"]'
const TRACKS = 'section[data-test^="genre-row-"] ul'

async function posterRatios(page: import('@playwright/test').Page): Promise<number[]> {
  return page.locator(POSTERS).evaluateAll((elements) => elements.map((element) => {
    const rect = element.getBoundingClientRect()

    return rect.height / rect.width
  }))
}

async function readyFor(page: import('@playwright/test').Page, screen: string): Promise<void> {
  const ready: Record<string, string> = {
    '/': 'genre-row-drama',
    '/search?q=bre': 'search-count',
    '/shows/1': 'detail-title',
    '/genres/drama': 'genre-grid'
  }

  await page.goto(screen)
  await expect(page.getByTestId(ready[screen] ?? 'app-main')).toBeVisible()
}

test('E2E-RESP-01 breakpoint switch', async ({ page }) => {
  await page.setViewportSize(VIEWPORTS.desktop)
  await page.goto('/')

  await expect(page.getByTestId('header-search-input')).toBeVisible()
  await expect(page.getByTestId('header-filter-btn')).toBeVisible()
  await expect(page.getByTestId('spotlight')).toBeVisible()
  await expect(page.getByTestId('bottom-nav')).toHaveCount(0)
  await expect(page.getByTestId('app-footer')).toBeVisible()

  await page.setViewportSize(VIEWPORTS.mobile)

  await expect(page.getByTestId('header-list-btn')).toBeVisible()
  await expect(page.getByTestId('header-wordmark')).toHaveText('Showtime')
  await expect(page.getByTestId('header-search-input')).toHaveCount(0)
  await expect(page.getByTestId('home-search-link')).toBeVisible()
  await expect(page.getByTestId('home-filter-btn')).toBeVisible()
  await expect(page.getByTestId('spotlight')).toHaveCount(0)
  await expect(page.getByTestId('bottom-nav')).toBeVisible()
  await expect(page.getByTestId('app-footer')).toHaveCount(0)

  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 })
    await expect(page.getByTestId('genre-row-drama')).toBeVisible()
    expect(await pageOverflowsHorizontally(page), `no horizontal page overflow at ${width}px`).toBe(false)
  }
})

test('E2E-RESP-02 genre rows stay horizontally scrollable at every width', async ({ page }) => {
  for (const width of [360, 582, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 })
    await readyFor(page, '/')

    const tracks = await page.locator(TRACKS).evaluateAll((elements) => elements.map((element) => {
      const overflowing = element.scrollWidth > element.clientWidth + 1

      element.scrollLeft = 120

      const scrollable = element.scrollLeft > 0

      element.scrollLeft = 0

      return { overflowing, scrollable }
    }))

    expect(tracks.length).toBeGreaterThanOrEqual(3)
    expect(tracks.some((entry) => entry.overflowing), `at least one row overflows at ${width}px`).toBe(true)
    expect(tracks.filter((entry) => entry.overflowing).every((entry) => entry.scrollable)).toBe(true)
    expect(await pageOverflowsHorizontally(page)).toBe(false)
  }
})

test('E2E-RESP-03 poster aspect ratio is preserved', async ({ page }) => {
  for (const viewport of [VIEWPORTS.mobileSmall, VIEWPORTS.mobile, VIEWPORTS.desktop, VIEWPORTS.desktopWide]) {
    await page.setViewportSize(viewport)

    for (const screen of ['/', '/genres/drama']) {
      await readyFor(page, screen)

      const ratios = await posterRatios(page)

      expect(ratios.length).toBeGreaterThan(0)

      for (const ratio of ratios) {
        expect(ratio).toBeGreaterThanOrEqual(1.46)
        expect(ratio).toBeLessThanOrEqual(1.5)
      }
    }
  }
})

test('E2E-RESP-04 content is never clipped', async ({ page }) => {
  for (const viewport of [VIEWPORTS.mobile, VIEWPORTS.mobileSmall, VIEWPORTS.desktop, VIEWPORTS.desktopWide]) {
    await page.setViewportSize(viewport)

    for (const screen of SCREENS) {
      await readyFor(page, screen)

      const report = await page.evaluate(() => {
        const clipped: string[] = []
        const unreachable: string[] = []

        for (const element of document.querySelectorAll<HTMLElement>('[data-test]')) {
          const style = getComputedStyle(element)
          const hasEllipsis = style.textOverflow === 'ellipsis' || style.webkitLineClamp !== 'none'
          const scrolls = ['auto', 'scroll'].includes(style.overflowX) || ['auto', 'scroll'].includes(style.overflowY)
          const hidesText = style.overflow !== 'visible' && !scrolls
          const overflows = element.scrollWidth > element.clientWidth + 1
            || element.scrollHeight > element.clientHeight + 1

          if (hidesText && overflows && !hasEllipsis && element.children.length === 0) {
            clipped.push(element.dataset.test ?? '')
          }
        }

        const controls = document.querySelectorAll<HTMLElement>(
          'a[data-test], button[data-test], input[data-test], select[data-test]'
        )

        for (const control of controls) {
          control.scrollIntoView({ block: 'center', inline: 'center' })

          const rect = control.getBoundingClientRect()
          const inside = rect.left >= 0 && rect.right <= window.innerWidth
            && rect.top >= 0 && rect.bottom <= window.innerHeight

          if (!inside) {
            unreachable.push(control.dataset.test ?? '')
          }
        }

        return { clipped, unreachable }
      })

      expect(report.clipped, `${screen} at ${viewport.width}px: clipped text`).toEqual([])
      expect(report.unreachable, `${screen} at ${viewport.width}px: unreachable controls`).toEqual([])
    }
  }
})

test.describe('Touch targets at mobile', () => {
  test.use({ viewport: VIEWPORTS.mobile })

  test('E2E-RESP-05 touch target size', async ({ page }) => {
    const screens: Record<string, string[]> = {
      '/': [
        'bottom-nav-home',
        'bottom-nav-search',
        'bottom-nav-list',
        'home-filter-btn',
        'home-search-link',
        'genre-chip-all',
        'genre-chip-drama',
        'genre-row-see-all',
        'show-card-1'
      ],
      '/search?q=bre': ['search-back-btn', 'search-clear-btn', 'sort-control'],
      '/shows/1': ['detail-back-btn', 'detail-add-btn', 'detail-tab-details'],
      '/genres/drama': ['filter-chip-rating-8', 'filter-chip-year-2024', 'genre-load-more-btn']
    }

    for (const [screen, ids] of Object.entries(screens)) {
      await readyFor(page, screen)

      for (const id of ids) {
        const rect = await box(page.getByTestId(id).first())

        expect.soft(rect.width, `${id} width on ${screen}`).toBeGreaterThanOrEqual(44)
        expect.soft(rect.height, `${id} height on ${screen}`).toBeGreaterThanOrEqual(44)
      }
    }
  })
})
