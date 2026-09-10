import { IDS } from './fixtures/catalog'
import { test, expect } from './fixtures'
import { track, scrollTo, VIEWPORTS, scrollLeft, pageScrollY, isNonIncreasing, readSearchRatings } from './fixtures/dom'

const CARDS = 'a[data-test^="show-card-"]'
const EPISODES = '[data-test^="episode-card-"]'

test.describe('Critical user journeys at mobile', () => {
  test.use({ viewport: VIEWPORTS.mobile })

  test('E2E-JOURNEY-01 browse by genre and open the first episode', async ({ page }) => {
    await page.goto('/')

    const sports = page.getByTestId('genre-row-sports')

    await sports.scrollIntoViewIfNeeded()
    await expect(sports).toBeInViewport()
    await scrollTo(track(sports), 160)
    await expect.poll(() => scrollLeft(track(sports))).toBeGreaterThan(0)

    await sports.getByTestId(`show-card-${IDS.fullCount}`).click()

    await expect(page).toHaveURL(`/shows/${IDS.fullCount}`)
    await expect(page.getByTestId('detail-title')).toHaveText('Full Count')

    await page.getByTestId('detail-episodes').locator(EPISODES).first().click()

    const modal = page.getByTestId('episode-modal')

    await expect(modal.getByTestId('episode-modal-code')).toContainText('S1:E1')
    await expect(modal.getByTestId('episode-modal-title')).toHaveText('Episode 1 of Season 1')
  })

  test('E2E-JOURNEY-02 find a show by name', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('home-search-link').click()
    await expect(page.getByTestId('search-input')).toBeFocused()

    await page.getByTestId('search-input').pressSequentially('bre')
    await expect(page.getByTestId('search-count')).toHaveText('5 results for “bre”')

    await page.getByTestId('sort-control').click()
    await page.getByTestId('sort-option-rating').click()

    await expect(page.getByTestId('sort-control')).toHaveText('Sort: Rating')
    expect(isNonIncreasing(await readSearchRatings(page))).toBe(true)

    const top = page.getByTestId('search-top-result')

    await expect(top.getByRole('heading')).toHaveText('Breakwater')
    await top.click()

    await expect(page).toHaveURL(`/shows/${IDS.breakwater}`)
    await expect(page.getByTestId('detail-title')).toHaveText('Breakwater')
    await expect(page.getByTestId('detail-hero').getByTestId('show-card-rating')).toHaveText('9.4')

    await page.getByTestId('detail-back-btn').click()

    await expect(page).toHaveURL('/search?q=bre')
    await expect(page.getByTestId('search-input')).toHaveValue('bre')
    await expect(page.getByTestId('search-count')).toHaveText('5 results for “bre”')
    await expect(page.getByTestId('sort-control')).toHaveText('Sort: Rating')
  })

  test('E2E-JOURNEY-03 explore a genre in depth', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('genre-row-drama').getByTestId('genre-row-see-all').click()

    await expect(page).toHaveURL('/genres/drama')
    await expect(page.getByTestId('genre-showing')).toHaveText('Showing 24 of 50')

    await page.getByTestId('filter-chip-rating-8').click()
    await expect(page.getByTestId('genre-showing')).toHaveText('Showing 24 of 28')

    await page.getByTestId('sort-control').click()
    await page.getByTestId('sort-option-rating').click()
    await expect(page.getByTestId('sort-control')).toHaveText('Sort: Rating')

    await page.getByTestId('genre-load-more-btn').click()
    await expect(page.getByTestId('genre-showing')).toHaveText('Showing 28 of 28')
    await expect(page.getByTestId('genre-load-more-btn')).toHaveCount(0)

    const card = page.getByTestId('genre-grid').getByTestId(`show-card-${IDS.cinderhouse}`)

    await card.scrollIntoViewIfNeeded()

    const scrolled = await pageScrollY(page)

    expect(scrolled).toBeGreaterThan(0)
    await card.click()

    await expect(page.getByTestId('detail-title')).toHaveText('Cinderhouse')

    await page.getByTestId('detail-back-btn').click()

    await expect(page).toHaveURL('/genres/drama')
    await expect(page.getByTestId('filter-chip-rating-8')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('genre-showing')).toHaveText('Showing 28 of 28')
    await expect(page.getByTestId('genre-grid').locator(CARDS)).toHaveCount(28)
  })

  test('E2E-JOURNEY-04 build a watchlist', async ({ page }) => {
    const picks = [
      { row: 'drama', id: IDS.nightfall, title: 'Nightfall County' },
      { row: 'comedy', id: IDS.roommates, title: 'Roommates' },
      { row: 'sports', id: IDS.fullCount, title: 'Full Count' }
    ]

    for (const pick of picks) {
      await page.goto('/')
      await page.getByTestId(`genre-row-${pick.row}`).getByTestId(`show-card-${pick.id}`).click()
      await expect(page.getByTestId('detail-title')).toHaveText(pick.title)
      await page.getByTestId('detail-add-btn').click()
      await expect(page.getByTestId('detail-add-btn')).toHaveAttribute('aria-pressed', 'true')
    }

    await page.getByTestId('bottom-nav-list').click()

    await expect(page).toHaveURL('/list')
    await expect(page.getByTestId('list-grid').getByTestId('show-card-title'))
      .toHaveText(['Nightfall County', 'Roommates', 'Full Count'])

    await page.getByTestId('list-grid').getByTestId(`show-card-${IDS.roommates}`).click()
    await expect(page.getByTestId('detail-add-btn')).toHaveAttribute('aria-pressed', 'true')
    await page.getByTestId('detail-add-btn').click()
    await expect(page.getByTestId('detail-add-btn')).toHaveAttribute('aria-pressed', 'false')

    await page.getByTestId('bottom-nav-list').click()

    await expect(page.getByTestId('list-grid').getByTestId('show-card-title'))
      .toHaveText(['Nightfall County', 'Full Count'])

    await page.reload()

    await expect(page.getByTestId('list-grid').getByTestId('show-card-title'))
      .toHaveText(['Nightfall County', 'Full Count'])
  })
})
