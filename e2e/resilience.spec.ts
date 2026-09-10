import { test, expect } from './fixtures'
import { box, readCls, VIEWPORTS, installClsMeter } from './fixtures/dom'

const CARDS = 'a[data-test^="show-card-"]'

test.describe('Resilience at mobile', () => {
  test.use({ viewport: VIEWPORTS.mobile })

  test('E2E-RES-01 slow network shows loading state', async ({ page, api }) => {
    await installClsMeter(page)
    api.slow(/\/home\b/, 1200)

    await page.goto('/')

    await expect(page.getByTestId('home-skeleton')).toBeVisible()
    await expect(page.getByTestId('genre-row-drama')).toHaveCount(0)
    await expect(page.getByTestId('genre-row-drama')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('home-skeleton')).toHaveCount(0)
    await expect.poll(() => readCls(page)).toBeLessThan(0.1)
  })

  test('E2E-RES-02 catalogue API failure', async ({ page, api }) => {
    api.fail(/^\/api\/v1\/home/)

    await page.goto('/')

    await expect(page.getByTestId('home-error')).toContainText('Something went wrong')
    await expect(page.getByTestId('home-error').getByTestId('state-retry-btn')).toHaveText('Try again')
    await expect(page.locator(CARDS)).toHaveCount(0)

    api.recover()
    await page.getByTestId('home-error').getByTestId('state-retry-btn').click()

    await expect(page.getByTestId('home-error')).toHaveCount(0)
    await expect(page.getByTestId('genre-row-drama')).toBeVisible()
    await expect(page.getByTestId('genre-row-drama').locator(CARDS)).toHaveCount(12)
  })

  test('E2E-RES-03 search API failure', async ({ page, api }) => {
    api.fail(/^\/api\/v1\/search/)

    await page.goto('/search')
    await page.getByTestId('search-input').fill('bre')

    const error = page.getByTestId('search-error')

    await expect(error).toContainText('Something went wrong')
    await expect(error.getByTestId('state-retry-btn')).toBeVisible()
    await expect(page.getByTestId('search-input')).toHaveValue('bre')
    await expect(page.getByTestId('search-top-result')).toHaveCount(0)

    await page.getByTestId('sort-control').click()

    await expect(page.getByTestId('sort-option-rating')).toBeVisible()

    await page.getByTestId('sort-option-relevance').click()
    await expect(page.getByTestId('bottom-nav-home')).toBeEnabled()

    api.recover()
    await error.getByTestId('state-retry-btn').click()

    await expect(page.getByTestId('search-error')).toHaveCount(0)
    await expect(page.getByTestId('search-count')).toHaveText('5 results for “bre”')
  })

  test('E2E-RES-04 broken poster images', async ({ page }) => {
    await page.route('https://example.test/**', (route) => route.fulfill({ status: 404, body: 'missing' }))
    await page.goto('/')

    const cards = page.getByTestId('genre-row-drama').locator(CARDS)

    await expect(cards).toHaveCount(12)

    for (const card of await cards.all()) {
      await expect(card.getByTestId('poster-fallback-span')).toBeVisible()
      await expect(card.getByTestId('show-card-title')).toBeVisible()
      await expect(card.getByTestId('show-card-rating')).toHaveText(/\d\.\d/)
      await expect(card.getByTestId('show-card-meta')).toHaveText(/·/)

      const poster = await box(card.getByTestId('poster-div'))

      expect(poster.height / poster.width).toBeGreaterThanOrEqual(1.46)
      expect(poster.height / poster.width).toBeLessThanOrEqual(1.5)
    }

    await expect(cards.first().getByTestId('poster-fallback-span')).toHaveText('N')

    await page.goto('/genres/drama')

    const grid = page.getByTestId('genre-grid').locator(CARDS)

    await expect(grid).toHaveCount(24)
    await expect(grid.first().getByTestId('poster-fallback-span')).toBeVisible()

    const boxes = await Promise.all([0,
      1,
      2,
      3,
      4,
      5].map((index) => box(grid.nth(index))))

    expect(boxes[1]?.y).toBe(boxes[0]?.y)
    expect(boxes[2]?.y).toBe(boxes[0]?.y)
    expect(boxes[4]?.y).toBe(boxes[3]?.y)
    expect(boxes[5]?.y).toBe(boxes[3]?.y)
    expect(boxes[3]?.x).toBe(boxes[0]?.x)
  })

  test('E2E-RES-07 a failing next page leaves the loaded grid intact', async ({ page, api }) => {
    await page.goto('/genres/drama')

    const grid = page.getByTestId('genre-grid')

    await expect(grid.locator(CARDS)).toHaveCount(24)

    api.fail(/^\/api\/v1\/genres\/drama\?.*[?&]offset=24(&|$)/)
    await page.getByTestId('genre-load-more-btn').click()

    const failure = page.getByTestId('genre-load-more-error')

    await expect(grid).toBeVisible()
    await expect(grid.locator(CARDS)).toHaveCount(24)
    await expect(page.getByTestId('genre-error')).toHaveCount(0)
    await expect(page.getByTestId('genre-skeleton')).toHaveCount(0)
    await expect(page.getByTestId('genre-showing')).toHaveText('Showing 24 of 50')
    await expect(failure).toContainText('Injected failure')
    await expect(failure.getByTestId('genre-load-more-retry-btn')).toHaveText('Try again')

    api.recover()
    await failure.getByTestId('genre-load-more-retry-btn').click()

    await expect(page.getByTestId('genre-load-more-error')).toHaveCount(0)
    await expect(grid.locator(CARDS)).toHaveCount(48)
    await expect(page.getByTestId('genre-showing')).toHaveText('Showing 48 of 50')
  })

  test('E2E-RES-06 rapid interaction does not corrupt state', async ({ page, api }) => {
    await page.goto('/')
    await expect(page.getByTestId('genre-row-drama')).toBeVisible()

    api.slow(/genre=comedy/, 300)

    for (let index = 0; index < 5; index += 1) {
      await page.getByTestId('genre-chip-comedy').click()
      await page.getByTestId('genre-chip-sports').click()
    }

    await expect.poll(() => api.pending).toBe(0)
    await expect(page.getByTestId('genre-chip-sports')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('genre-row-sports')).toBeVisible()
    await expect(page.getByTestId('genre-row-comedy')).toHaveCount(0)
    await expect(page.locator('section[data-test^="genre-row-"]')).toHaveCount(1)
  })
})

test.describe('Resilience at desktop', () => {
  test.use({ viewport: VIEWPORTS.desktop })

  test('E2E-RES-01 slow network shows loading state without layout shift', async ({ page, api }) => {
    await installClsMeter(page)
    api.slow(/\/home\b/, 1200)

    await page.goto('/')

    await expect(page.getByTestId('home-skeleton')).toBeVisible()
    await expect(page.getByTestId('genre-row-drama')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('home-skeleton')).toHaveCount(0)
    await expect.poll(() => readCls(page)).toBeLessThan(0.1)
  })
})
