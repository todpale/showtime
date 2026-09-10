import { test, expect } from './fixtures'
import { IDS, BRE_TITLES } from './fixtures/catalog'
import { box, VIEWPORTS, pageScrollY, isNonIncreasing, readSearchRatings } from './fixtures/dom'

const RESULT_ROWS = 'a[data-test^="search-result-row-"]'

async function resultTitles(page: import('@playwright/test').Page): Promise<string[]> {
  const top = await page.getByTestId('search-top-result').getByRole('heading').allTextContents()
  const rows = await page.locator(RESULT_ROWS).getByRole('heading').allTextContents()

  return [...top, ...rows].map((text) => text.trim())
}

test.describe('Search at mobile', () => {
  test.use({ viewport: VIEWPORTS.mobile })

  test.beforeEach(async ({ page }) => {
    await page.goto('/search')
    await expect(page.getByTestId('search-input')).toBeVisible()
  })

  test('E2E-SEARCH-01 search by show name returns matching results', async ({ page }) => {
    await page.getByTestId('search-input').fill('bre')

    await expect(page.getByTestId('search-count')).toHaveText('5 results for “bre”')
    await expect(page.getByTestId('search-top-result')).toHaveCount(1)
    await expect(page.locator(RESULT_ROWS)).toHaveCount(4)
    expect((await resultTitles(page)).sort()).toEqual([...BRE_TITLES].sort())
  })

  test('E2E-SEARCH-02 results are ordered by rating, descending', async ({ page }) => {
    await page.getByTestId('search-input').fill('bre')
    await expect(page.locator(RESULT_ROWS)).toHaveCount(4)

    await page.getByTestId('sort-control').click()
    await page.getByTestId('sort-option-rating').click()

    await expect(page.getByTestId('sort-control')).toHaveText('Sort: Rating')
    await expect(page.getByTestId('search-top-result').getByRole('heading')).toHaveText('Breakwater')
    expect(await readSearchRatings(page)).toEqual([9.4,
      8.8,
      8.6,
      8.2,
      7.9])
  })

  test('E2E-SEARCH-03 top result is visually and structurally distinct', async ({ page }) => {
    await page.getByTestId('search-input').fill('bre')

    const top = page.getByTestId('search-top-result')
    const rows = page.locator(RESULT_ROWS)

    await expect(rows).toHaveCount(4)
    await expect(top).toContainText('Top result')
    await expect(top.getByTestId('poster-div')).toBeVisible()
    await expect(top).toContainText('follows a close-knit group')
    await expect(top).toHaveAttribute('href', `/shows/${IDS.brightHollow}`)

    const topPoster = await box(top.getByTestId('poster-div'))
    const rowPoster = await box(rows.first().getByTestId('poster-div'))

    expect(topPoster.width).toBeGreaterThan(rowPoster.width)

    for (const row of await rows.all()) {
      await expect(row).not.toContainText('Top result')
      await expect(row.getByTestId('search-result-rating')).toHaveText(/\d\.\d/)
    }
  })

  test('E2E-SEARCH-04 query is debounced', async ({ page, api }) => {
    await page.getByTestId('search-input').pressSequentially('bre', { delay: 30 })
    await expect(page.getByTestId('search-count')).toHaveText('5 results for “bre”')

    const requests = api.requestsTo('/search')

    expect(requests).toHaveLength(1)
    expect(requests[0]?.searchParams.get('q')).toBe('bre')
  })

  test('E2E-SEARCH-05 clear button resets the search', async ({ page }) => {
    await page.getByTestId('search-input').fill('bre')
    await expect(page.locator(RESULT_ROWS)).toHaveCount(4)

    await page.getByTestId('search-clear-btn').click()

    await expect(page.getByTestId('search-input')).toHaveValue('')
    await expect(page.getByTestId('search-input')).toBeFocused()
    await expect(page.getByTestId('search-count')).toHaveCount(0)
    await expect(page.getByTestId('search-top-result')).toHaveCount(0)
    await expect(page.locator(RESULT_ROWS)).toHaveCount(0)
    await expect(page.getByTestId('recent-searches')).toBeVisible()
    await expect(page.getByTestId('recent-search-pill-0')).toContainText('bre')
  })

  test('E2E-SEARCH-06 no results state', async ({ page }) => {
    await page.getByTestId('search-input').fill('zzzzzz')

    await expect(page.getByTestId('search-empty')).toContainText('Nothing matches “zzzzzz”')
    await expect(page.getByTestId('search-empty')).toContainText('browse by genre')
    await expect(page.getByTestId('search-top-result')).toHaveCount(0)
    await expect(page.locator(RESULT_ROWS)).toHaveCount(0)
    await expect(page.getByTestId('search-clear-btn')).toBeVisible()
    await expect(page.getByTestId('bottom-nav-home')).toBeVisible()
  })

  test('E2E-SEARCH-07 recent searches are recorded and reusable', async ({ page }) => {
    const input = page.getByTestId('search-input')

    await input.fill('Breakwater')
    await expect(page.getByTestId('search-count')).toHaveText('1 result for “Breakwater”')
    await page.getByTestId('search-clear-btn').click()
    await input.fill('Crime')
    await expect(page.getByTestId('search-empty')).toContainText('Nothing matches “Crime”')
    await page.getByTestId('search-clear-btn').click()

    await expect(page.getByTestId('recent-search-pill-0')).toContainText('Crime')
    await expect(page.getByTestId('recent-search-pill-1')).toContainText('Breakwater')

    await page.getByTestId('recent-search-pill-1').getByRole('button', { name: 'Breakwater' }).click()

    await expect(input).toHaveValue('Breakwater')
    await expect(page).toHaveURL('/search?q=Breakwater')
    await expect(page.getByTestId('search-top-result').getByRole('heading')).toHaveText('Breakwater')
  })

  test('E2E-SEARCH-08 recent searches can be removed', async ({ page }) => {
    await page.evaluate(() => {
      window.localStorage.setItem('showtime.recent-searches', JSON.stringify(['Crime', 'Breakwater', 'bre']))
    })
    await page.reload()

    await expect(page.locator('[data-test^="recent-search-pill-"]')).toHaveCount(3)

    await page.getByTestId('recent-search-remove-1').click()

    await expect(page.locator('[data-test^="recent-search-pill-"]')).toHaveCount(2)
    await expect(page.getByTestId('recent-search-pill-0')).toContainText('Crime')
    await expect(page.getByTestId('recent-search-pill-1')).toContainText('bre')

    await page.getByTestId('recent-clear-btn').click()

    await expect(page.getByTestId('recent-searches')).toHaveCount(0)

    await page.reload()

    await expect(page.getByTestId('search-input')).toBeVisible()
    await expect(page.getByTestId('recent-searches')).toHaveCount(0)
    expect(await page.evaluate(() => window.localStorage.getItem('showtime.recent-searches'))).toBe('[]')
  })

  test('E2E-SEARCH-09 result opens the detail screen', async ({ page }) => {
    await page.getByTestId('search-input').fill('bre')

    const top = page.getByTestId('search-top-result')

    await expect(top.getByRole('heading')).toHaveText('Bright Hollow')
    await expect(top).toContainText('Mystery Horror · 2022')
    await expect(top).toContainText('8.6')

    await top.click()

    await expect(page).toHaveURL(`/shows/${IDS.brightHollow}`)
    await expect(page.getByTestId('detail-title')).toHaveText('Bright Hollow')
    await expect(page.getByTestId('detail-meta')).toContainText('2022')
    await expect(page.getByTestId('detail-meta')).toContainText('Mystery, Horror')
    await expect(page.getByTestId('detail-meta')).toContainText('2 seasons')
    await expect(page.getByTestId('detail-hero').getByTestId('show-card-rating')).toHaveText('8.6')
  })

  test('E2E-SEARCH-10 back preserves the query and scroll position', async ({ page }) => {
    await page.getByTestId('search-input').fill('bre')

    const row = page.locator(RESULT_ROWS).filter({ hasText: 'Brenner Files' })

    await expect(row).toHaveCount(1)
    await page.evaluate(() => window.scrollTo(0, 80))
    await row.scrollIntoViewIfNeeded()

    const scrolled = await pageScrollY(page)

    await row.click()
    await expect(page.getByTestId('detail-title')).toHaveText('Brenner Files')

    await page.goBack()

    await expect(page).toHaveURL('/search?q=bre')
    await expect(page.getByTestId('search-input')).toHaveValue('bre')
    await expect(page.getByTestId('search-count')).toHaveText('5 results for “bre”')
    await expect(page.locator(RESULT_ROWS)).toHaveCount(4)
    expect(scrolled).toBeGreaterThan(0)
  })

  test('E2E-SEARCH-11 case and diacritic insensitivity', async ({ page }) => {
    for (const query of ['SALT', 'salt', 'Sált']) {
      await page.getByTestId('search-input').fill(query)

      await expect(page.getByTestId('search-count')).toHaveText(`1 result for “${query}”`)
      await expect(page.getByTestId('search-top-result').getByRole('heading')).toHaveText('Salt & Ember')
    }
  })

  test('E2E-SEARCH-12 special characters are handled safely', async ({ page }) => {
    const dialogs: string[] = []
    const errors: string[] = []

    page.on('dialog', (dialog) => {
      dialogs.push(dialog.message())
      dialog.dismiss()
    })
    page.on('pageerror', (error) => errors.push(error.message))

    await page.getByTestId('search-input').fill('& " < > %')

    await expect(page.getByTestId('search-empty')).toContainText('Nothing matches “& " < > %”')

    await page.getByTestId('search-input').fill('<script>alert(1)</script>')

    await expect(page.getByTestId('search-empty')).toContainText('Nothing matches “<script>alert(1)</script>”')
    await expect(page.getByTestId('search-input')).toHaveValue('<script>alert(1)</script>')
    expect(dialogs).toEqual([])
    expect(errors).toEqual([])
    await expect(page.locator('script', { hasText: 'alert(1)' })).toHaveCount(0)
  })

  test('E2E-SEARCH-15 sort control changes result ordering', async ({ page }) => {
    await page.getByTestId('search-input').fill('bre')
    await expect(page.locator(RESULT_ROWS)).toHaveCount(4)
    await expect(page.getByTestId('sort-control')).toHaveText('Sort: Relevance')

    const byRelevance = await resultTitles(page)

    expect(byRelevance[0]).toBe('Bright Hollow')
    expect(isNonIncreasing(await readSearchRatings(page))).toBe(false)

    await page.getByTestId('sort-control').click()
    await page.getByTestId('sort-option-rating').click()

    await expect(page.getByTestId('sort-control')).toHaveText('Sort: Rating')
    await expect(page.getByTestId('search-top-result').getByRole('heading')).toHaveText('Breakwater')
    expect(isNonIncreasing(await readSearchRatings(page))).toBe(true)

    await page.getByTestId('sort-control').click()
    await page.getByTestId('sort-option-relevance').click()

    await expect(page.getByTestId('sort-control')).toHaveText('Sort: Relevance')
    await expect(page.getByTestId('search-top-result').getByRole('heading')).toHaveText('Bright Hollow')
    expect(await resultTitles(page)).toEqual(byRelevance)
  })
})

test.describe('Search at desktop', () => {
  test.use({ viewport: VIEWPORTS.desktop })

  test('E2E-SEARCH-13 desktop sidebar filters narrow results', async ({ page }) => {
    await page.goto('/search?q=bre')

    const sidebar = page.getByTestId('search-sidebar')

    await expect(page.getByTestId('search-count')).toHaveText('5 results for “bre”')

    await sidebar.getByTestId('filter-chip-crime').click()

    await expect(sidebar.getByTestId('filter-chip-crime')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('search-count')).toHaveText('3 results for “bre”')
    expect((await resultTitles(page)).sort()).toEqual(['Breakwater', 'Brenner Files', 'Brimstone County'])

    await sidebar.getByTestId('filter-rating-9').click()

    await expect(page.getByTestId('search-count')).toHaveText('1 result for “bre”')
    expect(await resultTitles(page)).toEqual(['Breakwater'])

    await sidebar.getByTestId('filter-rating-any').click()

    await expect(page.getByTestId('search-count')).toHaveText('3 results for “bre”')

    await sidebar.getByTestId('filter-chip-crime').click()

    await expect(page.getByTestId('search-count')).toHaveText('5 results for “bre”')
    expect((await resultTitles(page)).sort()).toEqual([...BRE_TITLES].sort())
  })

  test('E2E-SEARCH-14 desktop search is reachable from the header on every page', async ({ page }) => {
    for (const start of [`/shows/${IDS.nightfall}`, '/genres/drama']) {
      await page.goto(start)
      await expect(page.getByTestId('header-search-input')).toBeVisible()

      await page.getByTestId('header-search-input').fill('bre')
      await page.getByTestId('header-search-input').press('Enter')

      await expect(page).toHaveURL('/search?q=bre')
      await expect(page.getByTestId('search-count')).toHaveText('5 results for “bre”')
      await expect(page.getByTestId('header-search-input')).toHaveValue('bre')
    }
  })
})
