import { IDS } from './fixtures/catalog'
import { test, expect } from './fixtures'
import { box, VIEWPORTS, readYears, readRatings, pageScrollY, isNonIncreasing } from './fixtures/dom'

const CARDS = 'a[data-test^="show-card-"]'

async function cardIds(page: import('@playwright/test').Page): Promise<string[]> {
  return page.getByTestId('genre-grid').locator(CARDS)
    .evaluateAll((elements) => elements.map((element) => element.getAttribute('data-test') ?? ''))
}

test.describe('Genre screen at mobile', () => {
  test.use({ viewport: VIEWPORTS.mobile })

  test.beforeEach(async ({ page }) => {
    await page.goto('/genres/drama')
    await expect(page.getByTestId('genre-grid')).toBeVisible()
  })

  test('E2E-GENRE-01 genre screen renders the full catalogue in a 3-column grid', async ({ page }) => {
    await expect(page.getByTestId('genre-title')).toHaveText('Drama')
    await expect(page.getByTestId('genre-subtitle')).toHaveText('50 shows · sorted by rating')

    const cards = page.getByTestId('genre-grid').locator(CARDS)

    await expect(cards).toHaveCount(24)

    const rows = await Promise.all([0, 1, 2, 3].map((index) => box(cards.nth(index))))

    expect(rows[1]?.y).toBe(rows[0]?.y)
    expect(rows[2]?.y).toBe(rows[0]?.y)
    expect(rows[3]?.y).toBeGreaterThan(rows[0]?.y ?? 0)
  })

  test('E2E-GENRE-02 grid is sorted by rating, descending', async ({ page }) => {
    const grid = page.getByTestId('genre-grid')
    const first = await readRatings(grid)

    expect(first.slice(0, 6)).toEqual([9.4,
      9.3,
      9.1,
      9.0,
      8.9,
      8.8])
    expect(isNonIncreasing(first)).toBe(true)

    await page.getByTestId('genre-load-more-btn').click()
    await expect(grid.locator(CARDS)).toHaveCount(48)

    const whole = await readRatings(grid)

    expect(whole).toHaveLength(48)
    expect(isNonIncreasing(whole)).toBe(true)
  })

  test('E2E-GENRE-03 sort control changes ordering', async ({ page }) => {
    await expect(page.getByTestId('sort-control')).toHaveText('Sort: Rating')

    await page.getByTestId('sort-control').click()
    await page.getByTestId('sort-option-year').click()

    await expect(page.getByTestId('sort-control')).toHaveText('Sort: Year (newest)')
    await expect(page.getByTestId('genre-subtitle')).toHaveText('50 shows · sorted by year (newest)')

    const years = await readYears(page.getByTestId('genre-grid'))

    expect(years[0]).toBe(2024)
    expect(isNonIncreasing(years)).toBe(true)
    expect(isNonIncreasing(await readRatings(page.getByTestId('genre-grid')))).toBe(false)
  })

  test('E2E-GENRE-04 filter chips narrow the grid', async ({ page }) => {
    await expect(page.getByTestId('genre-showing')).toHaveText('Showing 24 of 50')

    await page.getByTestId('filter-chip-rating-8').click()

    await expect(page.getByTestId('filter-chip-rating-8')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('genre-showing')).toHaveText('Showing 24 of 28')
    await expect(page.getByTestId('genre-subtitle')).toHaveText('28 shows · sorted by rating')

    const ratings = await readRatings(page.getByTestId('genre-grid'))

    expect(ratings).toHaveLength(24)
    expect(Math.min(...ratings)).toBeGreaterThanOrEqual(8)

    await page.getByTestId('filter-chip-rating-8').click()

    await expect(page.getByTestId('filter-chip-rating-8')).toHaveAttribute('aria-pressed', 'false')
    await expect(page.getByTestId('genre-showing')).toHaveText('Showing 24 of 50')
  })

  test('E2E-GENRE-05 multiple filters combine', async ({ page }) => {
    await page.getByTestId('filter-chip-rating-8').click()
    await page.getByTestId('filter-chip-year-2022').click()

    await expect(page.getByTestId('filter-chip-rating-8')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('filter-chip-year-2022')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('genre-showing')).toHaveText('Showing 3 of 3')

    const grid = page.getByTestId('genre-grid')

    await expect(grid.getByTestId('show-card-title')).toHaveText(['Ash & Iron', 'Northern Light', 'Paper Kingdom'])
    expect(Math.min(...await readRatings(grid))).toBeGreaterThanOrEqual(8)
    expect(await readYears(grid)).toEqual([2022, 2022, 2022])
  })

  test('E2E-GENRE-06 filters that exclude everything leave the year chip on offer', async ({ page }) => {
    const years = page.locator('[data-test^="filter-chip-year-"]')

    await page.getByTestId('filter-chip-year-2022').click()

    await expect(page.getByTestId('filter-chip-year-2022')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('genre-showing')).toHaveText('Showing 3 of 3')

    await page.getByTestId('filter-chip-rating-9').click()

    await expect(page.getByTestId('genre-empty')).toContainText('No shows match these filters.')
    await expect(page.getByTestId('genre-grid')).toHaveCount(0)
    await expect(years).toHaveText(['2024', '2023', '2022', '2021'])
    await expect(page.getByTestId('filter-chip-year-2022')).toBeVisible()
    await expect(page.getByTestId('filter-chip-year-2022')).toHaveAttribute('aria-pressed', 'true')

    await page.getByTestId('filter-chip-year-2022').click()

    await expect(page.getByTestId('genre-empty')).toHaveCount(0)
    await expect(page.getByTestId('genre-grid').locator(CARDS)).toHaveCount(4)
    await expect(page.getByTestId('genre-showing')).toHaveText('Showing 4 of 4')
    await expect(page.getByTestId('filter-chip-rating-9')).toHaveAttribute('aria-pressed', 'true')
    await expect(years).toHaveText(['2024', '2023', '2021'])
  })

  test('E2E-GENRE-13 reset lifts every filter from the empty state', async ({ page }) => {
    await page.getByTestId('filter-chip-year-2022').click()
    await page.getByTestId('filter-chip-rating-9').click()

    await expect(page.getByTestId('genre-empty')).toContainText('No shows match these filters.')
    await expect(page.getByTestId('genre-empty').getByTestId('state-retry-btn')).toHaveText('Reset filters')

    await page.getByTestId('genre-empty').getByTestId('state-retry-btn').click()

    await expect(page.getByTestId('genre-grid').locator(CARDS)).toHaveCount(24)
    await expect(page.getByTestId('genre-showing')).toHaveText('Showing 24 of 50')
    await expect(page.getByTestId('filter-chip-rating-9')).toHaveAttribute('aria-pressed', 'false')
    await expect(page.getByTestId('filter-chip-year-2022')).toHaveAttribute('aria-pressed', 'false')
  })

  test('E2E-GENRE-07 pagination / load more', async ({ page }) => {
    await expect(page.getByTestId('genre-showing')).toHaveText('Showing 24 of 50')

    await page.getByTestId('genre-load-more-btn').click()

    await expect(page.getByTestId('genre-showing')).toHaveText('Showing 48 of 50')

    const ids = await cardIds(page)

    expect(ids).toHaveLength(48)
    expect(new Set(ids).size).toBe(48)

    await page.getByTestId('genre-load-more-btn').click()

    await expect(page.getByTestId('genre-showing')).toHaveText('Showing 50 of 50')
    expect(new Set(await cardIds(page)).size).toBe(50)
    await expect(page.getByTestId('genre-load-more-btn')).toHaveCount(0)
  })

  test('E2E-GENRE-08 card selection and back', async ({ page }) => {
    await page.getByTestId('filter-chip-rating-8').click()
    await expect(page.getByTestId('genre-showing')).toHaveText('Showing 24 of 28')

    const card = page.getByTestId('genre-grid').getByTestId(`show-card-${IDS.blackwater}`)

    await page.evaluate(() => window.scrollTo(0, 400))
    await card.scrollIntoViewIfNeeded()

    const scrolled = await pageScrollY(page)

    await card.click()

    await expect(page).toHaveURL(`/shows/${IDS.blackwater}`)
    await expect(page.getByTestId('detail-title')).toHaveText('Blackwater Bay')

    await page.goBack()

    await expect(page).toHaveURL('/genres/drama')
    await expect(page.getByTestId('filter-chip-rating-8')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('sort-control')).toHaveText('Sort: Rating')
    await expect(page.getByTestId('genre-showing')).toHaveText('Showing 24 of 28')
    expect(scrolled).toBeGreaterThan(0)
  })

  test('E2E-GENRE-10 single-show genre', async ({ page }) => {
    await page.goto('/genres/western')

    await expect(page.getByTestId('genre-title')).toHaveText('Western')
    await expect(page.getByTestId('genre-subtitle')).toHaveText('1 shows · sorted by rating')

    const cards = page.getByTestId('genre-grid').locator(CARDS)

    await expect(cards).toHaveCount(1)
    await expect(cards.first().getByTestId('show-card-title')).toHaveText('Lone Mesa')

    const grid = await box(page.getByTestId('genre-grid'))
    const card = await box(cards.first())

    expect(Math.abs(card.x - grid.x)).toBeLessThan(2)
    expect(card.width).toBeLessThan(grid.width / 2)
    await expect(page.getByTestId('genre-load-more-btn')).toHaveCount(0)
  })

  test('E2E-GENRE-11 every year chip on offer leads to shows', async ({ page }) => {
    await page.getByTestId('filter-chip-rating-9').click()

    await expect(page.getByTestId('genre-showing')).toHaveText('Showing 4 of 4')

    const offered = await page.locator('[data-test^="filter-chip-year-"]')
      .evaluateAll((chips) => chips.map((chip) => chip.getAttribute('data-test') ?? ''))

    expect(offered.length).toBeGreaterThan(0)

    for (const chip of offered) {
      await page.getByTestId(chip).click()

      await expect(page.getByTestId('genre-empty')).toHaveCount(0)
      await expect(page.getByTestId('genre-grid').locator(CARDS).first()).toBeVisible()

      await page.getByTestId(chip).click()
    }
  })

  test('E2E-GENRE-12 year chips follow the years that are still reachable', async ({ page }) => {
    const years = page.locator('[data-test^="filter-chip-year-"]')

    await expect(years).toHaveText(['2024',
      '2023',
      '2022',
      '2021',
      '2020',
      '2019'])

    await page.getByTestId('filter-chip-rating-9').click()

    await expect(years).toHaveText(['2024', '2023', '2021'])

    await page.getByTestId('filter-chip-rating-9').click()

    await expect(years).toHaveText(['2024',
      '2023',
      '2022',
      '2021',
      '2020',
      '2019'])
  })
})

test.describe('Genre screen at desktop', () => {
  test.use({ viewport: VIEWPORTS.desktop })

  test('E2E-GENRE-01 desktop grid has 6 columns', async ({ page }) => {
    await page.goto('/genres/drama')

    const cards = page.getByTestId('genre-grid').locator(CARDS)

    await expect(cards).toHaveCount(24)

    const boxes = await Promise.all([0,
      1,
      2,
      3,
      4,
      5,
      6].map((index) => box(cards.nth(index))))

    for (const item of boxes.slice(1, 6)) {
      expect(item.y).toBe(boxes[0]?.y)
    }

    expect(boxes[6]?.y).toBeGreaterThan(boxes[0]?.y ?? 0)
  })

  test('E2E-GENRE-09 breadcrumb / back to browse', async ({ page }) => {
    await page.goto('/genres/drama')

    await expect(page.getByTestId('genre-breadcrumb')).toHaveText('Browse genres')

    await page.getByTestId('genre-breadcrumb').click()

    await expect(page).toHaveURL('/genres')
    await expect(page.getByTestId('genres-view')).toBeVisible()
    await expect(page.getByTestId('genre-tile-drama')).toBeVisible()
  })
})
