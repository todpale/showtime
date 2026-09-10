import { test, expect } from './fixtures'
import { ApiMock, installApi } from './fixtures/api'
import { IDS, tiedSeeds, buildCatalog } from './fixtures/catalog'
import {
  box,
  track,
  scrollTo,
  VIEWPORTS,
  scrollLeft,
  readRatings,
  pageScrollY,
  scrollMetrics,
  isNonIncreasing,
  fullyVisibleCount
} from './fixtures/dom'

const ROWS = 'section[data-test^="genre-row-"]'
const CARDS = 'a[data-test^="show-card-"]'

test.describe('Home dashboard at mobile', () => {
  test.use({ viewport: VIEWPORTS.mobile })

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('genre-row-drama')).toBeVisible()
  })

  test('E2E-HOME-01 home renders the genre dashboard', async ({ page }) => {
    await expect(page.getByTestId('header-wordmark')).toHaveText('Showtime')
    await expect(page.getByTestId('home-search-link')).toBeVisible()
    await expect(page.getByTestId('home-filter-btn')).toBeVisible()

    const rows = page.locator(ROWS)

    await expect(rows.nth(2)).toBeVisible()

    for (const row of await rows.all()) {
      await expect(row.getByTestId('genre-row-title')).not.toBeEmpty()
      await expect(row.getByRole('list')).toBeVisible()
      await expect(row.locator(CARDS).first()).toBeVisible()
    }

    const cards = page.locator(CARDS)

    for (const card of await cards.all()) {
      await expect(card.getByTestId('poster-div')).toBeAttached()
      await expect(card.getByTestId('show-card-rating')).toHaveText(/^\s*(\d\.\d|—)\s*$/)
      await expect(card.getByTestId('show-card-title')).not.toBeEmpty()
      await expect(card.getByTestId('show-card-meta')).toHaveText(/^.+ · \d{4}$/)
    }
  })

  test('E2E-HOME-02 shows within a genre row are sorted by rating, descending', async ({ page }) => {
    const drama = await readRatings(page.getByTestId('genre-row-drama'))
    const comedy = await readRatings(page.getByTestId('genre-row-comedy'))
    const sports = await readRatings(page.getByTestId('genre-row-sports'))

    expect(drama.slice(0, 3)).toEqual([9.4, 9.3, 9.1])
    expect(drama).toHaveLength(12)
    expect(isNonIncreasing(drama)).toBe(true)
    expect(isNonIncreasing(comedy)).toBe(true)
    expect(isNonIncreasing(sports)).toBe(true)

    await expect(page.getByTestId('genre-row-drama').getByTestId('show-card-title').first())
      .toHaveText('Nightfall County')
    await expect(page.getByTestId('genre-row-comedy').getByTestId('show-card-title').first()).toHaveText('Roommates')
    await expect(page.getByTestId('genre-row-sports').getByTestId('show-card-title').first()).toHaveText('Full Count')
    expect(Math.max(...comedy)).toBe(comedy[0])
    expect(Math.max(...sports)).toBe(sports[0])
  })

  test('E2E-HOME-03 tied ratings produce a stable, deterministic order', async ({ browser }) => {
    async function tiedTitles(): Promise<string[]> {
      const context = await browser.newContext({ viewport: VIEWPORTS.mobile })
      const page = await context.newPage()

      await installApi(page, new ApiMock(buildCatalog(tiedSeeds())))
      await page.goto('/')

      const cards = page.getByTestId('genre-row-drama').locator(CARDS)

      await expect(cards).toHaveCount(12)

      const titles = await cards.evaluateAll((elements) => elements
        .filter((element) => element.querySelector('[data-test="show-card-rating"]')?.textContent?.trim() === '8.5')
        .map((element) => element.querySelector('[data-test="show-card-title"]')?.textContent?.trim() ?? ''))

      await context.close()

      return titles
    }

    const first = await tiedTitles()
    const second = await tiedTitles()

    expect(first).toEqual(['Amber Coast', 'Blackwater Bay', 'Zero Hour'])
    expect(second).toEqual(first)
  })

  test('E2E-HOME-04 horizontal row scrolls independently', async ({ page }) => {
    const drama = track(page.getByTestId('genre-row-drama'))
    const comedy = track(page.getByTestId('genre-row-comedy'))
    const comedyBefore = await scrollLeft(comedy)
    const pageBefore = await pageScrollY(page)

    await drama.hover()
    await page.mouse.wheel(400, 0)

    await expect.poll(() => scrollLeft(drama)).toBeGreaterThan(0)
    await expect(drama.locator(CARDS).nth(4)).toBeInViewport()
    expect(await scrollLeft(comedy)).toBe(comedyBefore)
    expect(await pageScrollY(page)).toBe(pageBefore)
  })

  test('E2E-HOME-05 partially visible card signals more content', async ({ page, viewport }) => {
    const width = viewport?.width ?? 0

    for (const slug of ['drama', 'comedy', 'sports']) {
      const list = track(page.getByTestId(`genre-row-${slug}`))
      const rects = await list.locator(CARDS).evaluateAll((elements) => elements.map((element) => {
        const rect = element.getBoundingClientRect()

        return { left: rect.left, right: rect.right }
      }))
      const clipped = rects.filter((rect) => rect.left < width && rect.right > width)

      expect(clipped, `${slug} row should have a card clipped by the viewport edge`).toHaveLength(1)

      await scrollTo(list, 100000)

      const metrics = await scrollMetrics(list)
      const last = await box(list.locator(CARDS).last())

      expect(last.x + last.width).toBeLessThanOrEqual(width + 1)
      expect(metrics.scrollLeft + metrics.clientWidth).toBeGreaterThanOrEqual(metrics.scrollWidth - 1)
    }
  })

  test('E2E-HOME-06 selecting a show opens the detail screen', async ({ page }) => {
    const card = page.getByTestId('genre-row-drama').getByTestId(`show-card-${IDS.nightfall}`)

    await expect(card.getByTestId('show-card-title')).toHaveText('Nightfall County')

    const rating = (await card.getByTestId('show-card-rating').textContent())?.trim()

    await card.click()

    await expect(page).toHaveURL(`/shows/${IDS.nightfall}`)
    await expect(page.getByTestId('detail-title')).toHaveText('Nightfall County')
    await expect(page.getByTestId('detail-hero').getByTestId('show-card-rating')).toHaveText(rating ?? '9.4')
    expect(rating).toBe('9.4')
  })

  test('E2E-HOME-07 genre chips filter the dashboard', async ({ page }) => {
    await expect(page.getByTestId('genre-chip-all')).toHaveAttribute('aria-pressed', 'true')

    await page.getByTestId('genre-chip-comedy').click()

    await expect(page.getByTestId('genre-chip-comedy')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('genre-chip-all')).toHaveAttribute('aria-pressed', 'false')
    await expect(page.locator('[data-test^="genre-chip-"][aria-pressed="true"]')).toHaveCount(1)
    await expect(page.locator(ROWS)).toHaveCount(1)
    await expect(page.getByTestId('genre-row-comedy')).toBeVisible()

    await page.getByTestId('genre-chip-all').click()

    await expect(page.getByTestId('genre-chip-all')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('genre-row-drama')).toBeVisible()
    await expect(page.getByTestId('genre-row-comedy')).toBeVisible()
    await expect(page.getByTestId('genre-row-sports')).toBeVisible()
    await expect(page.locator(ROWS)).toHaveCount(8)
  })

  test('E2E-HOME-08 "See all" opens the genre screen', async ({ page }) => {
    await page.getByTestId('genre-row-drama').getByTestId('genre-row-see-all').click()

    await expect(page).toHaveURL('/genres/drama')
    await expect(page.getByTestId('genre-title')).toHaveText('Drama')
    await expect(page.getByTestId('genre-subtitle')).toHaveText('50 shows · sorted by rating')
  })

  test('E2E-HOME-09 search entry point', async ({ page }) => {
    await expect(page.getByTestId('home-search-link')).toHaveText('Search shows by name')

    await page.getByTestId('home-search-link').click()

    await expect(page).toHaveURL('/search')
    await expect(page.getByTestId('search-input')).toBeFocused()
    await expect(page.getByTestId('search-input')).toHaveAttribute('placeholder', 'Search shows by name')
  })

  test('E2E-HOME-10 filter control opens filter options', async ({ page, api }) => {
    const counts = async (): Promise<number[]> => Promise.all(['drama', 'comedy', 'sports']
      .map((slug) => page.getByTestId(`genre-row-${slug}`).locator(CARDS).count()))

    expect(await counts()).toEqual([12, 7, 7])

    await page.getByTestId('home-filter-btn').click()

    const sheet = page.getByTestId('filter-sheet')

    await expect(sheet).toBeVisible()
    await expect(sheet.getByTestId('filter-rating-any')).toHaveAttribute('aria-pressed', 'true')
    await expect(sheet.getByTestId('filter-chip-comedy')).toBeVisible()

    await sheet.getByTestId('filter-rating-9').click()

    await expect(sheet.getByTestId('filter-rating-9')).toHaveAttribute('aria-pressed', 'true')
    await expect.poll(() => api.requestsTo('/home').at(-1)?.searchParams.get('minRating')).toBe('9')
    await expect.poll(counts).toEqual([4, 1, 2])

    for (const row of await page.locator(ROWS).all()) {
      const ratings = await readRatings(row)

      expect(ratings.length).toBeGreaterThan(0)
      expect(Math.min(...ratings)).toBeGreaterThanOrEqual(9)
    }

    await sheet.getByTestId('filter-reset-btn').click()

    await expect(sheet.getByTestId('filter-rating-any')).toHaveAttribute('aria-pressed', 'true')
    await expect.poll(counts).toEqual([12, 7, 7])

    await sheet.getByTestId('filter-close-btn').click()

    await expect(sheet).toHaveCount(0)
  })

  test('E2E-HOME-11 bottom navigation reflects location', async ({ page }) => {
    await expect(page.getByTestId('bottom-nav-home')).toHaveAttribute('aria-current', 'page')
    await expect(page.getByTestId('bottom-nav-search')).not.toHaveAttribute('aria-current', 'page')

    await page.getByTestId('bottom-nav-search').click()

    await expect(page).toHaveURL('/search')
    await expect(page.getByTestId('search-view')).toBeVisible()
    await expect(page.getByTestId('bottom-nav-search')).toHaveAttribute('aria-current', 'page')
    await expect(page.getByTestId('bottom-nav-home')).not.toHaveAttribute('aria-current', 'page')

    await page.getByTestId('bottom-nav-home').click()

    await expect(page).toHaveURL('/')
    await expect(page.getByTestId('bottom-nav-home')).toHaveAttribute('aria-current', 'page')
  })

  test('E2E-HOME-13 mobile shows at most 4 comedy cards and the row scrolls', async ({ page, viewport }) => {
    const list = track(page.getByTestId('genre-row-comedy'))
    const visible = await fullyVisibleCount(list.locator(CARDS), viewport?.width ?? 0)
    const metrics = await scrollMetrics(list)

    await expect(list.locator(CARDS)).toHaveCount(7)
    expect(visible).toBeLessThanOrEqual(4)
    expect(metrics.scrollWidth).toBeGreaterThan(metrics.clientWidth)
  })

  test('E2E-HOME-14 empty genre is not rendered as a broken row', async ({ page }) => {
    await expect(page.getByTestId('genre-chip-documentary')).toBeVisible()
    await expect(page.getByTestId('genre-row-documentary')).toHaveCount(0)

    for (const row of await page.locator(ROWS).all()) {
      const rect = await box(row)

      expect(rect.height).toBeGreaterThan(0)
      expect(rect.width).toBeGreaterThan(0)
      await expect(row.locator(CARDS).first()).toBeVisible()
    }

    await page.getByTestId('genre-chip-documentary').click()

    await expect(page.getByTestId('home-empty')).toBeVisible()
    await expect(page.locator(ROWS)).toHaveCount(0)
  })
})

test.describe('Home dashboard at desktop', () => {
  test.use({ viewport: VIEWPORTS.desktop })

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('genre-row-drama')).toBeVisible()
  })

  test('E2E-HOME-12 desktop spotlight banner', async ({ page }) => {
    const spotlight = page.getByTestId('spotlight')
    const rowsTop = (await box(page.getByTestId('genre-row-drama'))).y
    const spotlightBottom = (await box(spotlight)).y + (await box(spotlight)).height

    expect(spotlightBottom).toBeLessThanOrEqual(rowsTop)
    await expect(spotlight).toContainText('HBO original series')
    await expect(spotlight.getByRole('heading', { level: 1 })).toHaveText('Nightfall County')
    await expect(spotlight.getByTestId('show-card-rating')).toHaveText('9.4')
    await expect(spotlight).toContainText('2024 · Scripted · Drama, Crime, Mystery')
    await expect(spotlight.getByTestId('spotlight-watch-btn')).toHaveText('Watch now')
    await expect(spotlight.getByTestId('spotlight-list-btn')).toHaveText('Add to list')

    await spotlight.getByTestId('spotlight-list-btn').click()

    await expect(spotlight.getByTestId('spotlight-list-btn')).toHaveText('In My List')
    await expect.poll(() => page.evaluate(() => window.localStorage.getItem('showtime.my-list'))).toContain('"id":1,')

    await spotlight.getByTestId('spotlight-watch-btn').click()

    await expect(page).toHaveURL(`/shows/${IDS.nightfall}`)
    await expect(page.getByTestId('detail-title')).toHaveText('Nightfall County')
    await expect(page.getByTestId('detail-add-btn')).toHaveAttribute('aria-pressed', 'true')

    await page.getByTestId('header-nav-list').click()

    await expect(page.getByTestId('list-grid').getByTestId(`show-card-${IDS.nightfall}`)).toBeVisible()
  })

  test('E2E-HOME-13 desktop shows at least 6 comedy cards without scrolling', async ({ page, viewport }) => {
    const list = track(page.getByTestId('genre-row-comedy'))

    await expect(list.locator(CARDS)).toHaveCount(7)
    expect(await fullyVisibleCount(list.locator(CARDS), viewport?.width ?? 0)).toBeGreaterThanOrEqual(6)
  })
})
