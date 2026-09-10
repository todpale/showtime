import type { Page, Locator } from '@playwright/test'

const VIEWPORTS = {
  mobile: { width: 582, height: 862 },
  mobileSmall: { width: 360, height: 640 },
  desktop: { width: 1440, height: 1024 },
  desktopWide: { width: 1920, height: 1080 }
} as const

interface Box {
  x: number
  y: number
  width: number
  height: number
}

async function box(locator: Locator): Promise<Box> {
  const rect = await locator.boundingBox()

  if (!rect) {
    throw new Error(`No bounding box for ${locator.toString()}`)
  }

  return rect
}

async function readRatings(scope: Locator): Promise<number[]> {
  const texts = await scope.getByTestId('show-card-rating').allTextContents()

  return texts.map((text) => Number(text.trim())).filter((value) => !Number.isNaN(value))
}

async function readSearchRatings(page: Page): Promise<number[]> {
  const top = await page.getByTestId('search-top-result').allTextContents()
  const rows = await page.getByTestId('search-result-rating').allTextContents()

  return [...top.map((text) => text.match(/\d\.\d/)?.[0] ?? ''), ...rows].map((text) => Number(text.trim()))
}

function isNonIncreasing(values: number[]): boolean {
  return values.every((value, index) => index === 0 || value <= (values[index - 1] ?? value))
}

async function readYears(scope: Locator): Promise<number[]> {
  const texts = await scope.getByTestId('show-card-meta').allTextContents()

  return texts.map((text) => Number(text.trim().split('·').pop()?.trim()))
}

function track(row: Locator): Locator {
  return row.getByRole('list')
}

async function scrollLeft(locator: Locator): Promise<number> {
  return locator.evaluate((element) => element.scrollLeft)
}

interface ScrollMetrics {
  scrollLeft: number
  scrollWidth: number
  clientWidth: number
}

async function scrollMetrics(locator: Locator): Promise<ScrollMetrics> {
  return locator.evaluate((element) => ({
    scrollLeft: element.scrollLeft,
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth
  }))
}

async function scrollTo(locator: Locator, left: number): Promise<void> {
  await locator.evaluate((element, value) => {
    element.scrollLeft = value
  }, left)
}

async function pageScrollY(page: Page): Promise<number> {
  return page.evaluate(() => window.scrollY)
}

async function pageOverflowsHorizontally(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
}

async function focusedTestId(page: Page): Promise<string | null> {
  return page.evaluate(() => document.activeElement?.getAttribute('data-test') ?? null)
}

async function installClsMeter(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const target = window as unknown as { __cls: number }

    target.__cls = 0

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as (PerformanceEntry & { value: number, hadRecentInput: boolean })[]) {
        if (!entry.hadRecentInput) {
          target.__cls += entry.value
        }
      }
    }).observe({ type: 'layout-shift', buffered: true })
  })
}

async function readCls(page: Page): Promise<number> {
  return page.evaluate(() => (window as unknown as { __cls: number }).__cls)
}

async function fullyVisibleCount(cards: Locator, viewportWidth: number): Promise<number> {
  const boxes = await cards.evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect()))

  return boxes.filter((rect) => rect.left >= 0 && rect.right <= viewportWidth).length
}

async function contrastRatio(locator: Locator): Promise<number> {
  return locator.evaluate((element) => {
    function channel(value: number): number {
      const scaled = value / 255

      return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4
    }

    function parse(color: string): [number, number, number, number] {
      const parts = color.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0, 1]

      return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0, parts[3] ?? 1]
    }

    function luminance([r, g, b]: [number, number, number, number]): number {
      return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
    }

    function background(node: Element | null): [number, number, number, number] {
      let current = node

      while (current) {
        const color = parse(getComputedStyle(current).backgroundColor)

        if (color[3] > 0) {
          return color
        }

        current = current.parentElement
      }

      return [255, 255, 255, 1]
    }

    const fg = luminance(parse(getComputedStyle(element).color))
    const bg = luminance(background(element))
    const [light, dark] = fg > bg ? [fg, bg] : [bg, fg]

    return (light + 0.05) / (dark + 0.05)
  })
}

export {
  box,
  track,
  readCls,
  scrollTo,
  VIEWPORTS,
  readYears,
  scrollLeft,
  readRatings,
  pageScrollY,
  contrastRatio,
  focusedTestId,
  scrollMetrics,
  isNonIncreasing,
  installClsMeter,
  readSearchRatings,
  fullyVisibleCount,
  pageOverflowsHorizontally
}
