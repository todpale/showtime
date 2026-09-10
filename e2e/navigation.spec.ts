import { IDS } from './fixtures/catalog'
import { test, expect } from './fixtures'
import { VIEWPORTS, pageScrollY } from './fixtures/dom'

test.describe('Navigation at mobile', () => {
  test.use({ viewport: VIEWPORTS.mobile })

  test('E2E-NAV-01 bottom tab bar destinations', async ({ page }) => {
    await page.goto('/')

    const destinations = [
      { tab: 'search', url: '/search', view: 'search-view' },
      { tab: 'list', url: '/list', view: 'list-view' },
      { tab: 'home', url: '/', view: 'home-view' }
    ]

    for (const { tab, url, view } of destinations) {
      await page.getByTestId(`bottom-nav-${tab}`).click()

      await expect(page).toHaveURL(url)
      await expect(page.getByTestId(view)).toBeVisible()
      await expect(page.getByTestId(`bottom-nav-${tab}`)).toHaveAttribute('aria-current', 'page')
      await expect(page.locator('[data-test^="bottom-nav-"][aria-current="page"]')).toHaveCount(1)
    }
  })

  test('E2E-NAV-05 re-tapping the active tab scrolls to top', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('genre-row-sports').scrollIntoViewIfNeeded()

    expect(await pageScrollY(page)).toBeGreaterThan(0)
    await expect(page.getByTestId('bottom-nav-home')).toHaveAttribute('aria-current', 'page')

    await page.getByTestId('bottom-nav-home').click()

    await expect(page).toHaveURL('/')
    await expect.poll(() => pageScrollY(page)).toBe(0)
  })
})

test.describe('Navigation at desktop', () => {
  test.use({ viewport: VIEWPORTS.desktop })

  test('E2E-NAV-02 desktop header navigation', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByTestId('bottom-nav')).toHaveCount(0)
    await expect(page.getByTestId('app-footer')).toBeVisible()
    await expect(page.getByTestId('header-nav-home')).toHaveClass(/header__link--active/)

    await page.getByTestId('header-nav-genres').click()

    await expect(page).toHaveURL('/genres')
    await expect(page.getByTestId('genres-view')).toBeVisible()
    await expect(page.getByTestId('header-nav-genres')).toHaveClass(/header__link--active/)
    await expect(page.getByTestId('header-nav-home')).not.toHaveClass(/header__link--active/)

    await page.getByTestId('header-nav-list').click()

    await expect(page).toHaveURL('/list')
    await expect(page.getByTestId('list-view')).toBeVisible()
    await expect(page.getByTestId('header-nav-list')).toHaveClass(/header__link--active/)
    await expect(page.getByTestId('header-nav-genres')).not.toHaveClass(/header__link--active/)

    await page.getByTestId('header-nav-home').click()

    await expect(page).toHaveURL('/')
    await expect(page.getByTestId('home-view')).toBeVisible()
    await expect(page.getByTestId('header-nav-home')).toHaveClass(/header__link--active/)
    await expect(page.getByTestId('bottom-nav')).toHaveCount(0)
  })

  test('E2E-NAV-04 browser back/forward integrity', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('genre-row-drama').getByTestId('genre-row-see-all').click()
    await expect(page.getByTestId('genre-title')).toHaveText('Drama')
    await page.getByTestId('genre-grid').getByTestId(`show-card-${IDS.blackwater}`).click()
    await expect(page.getByTestId('detail-title')).toHaveText('Blackwater Bay')
    await page.getByTestId('header-search-input').fill('bre')
    await page.getByTestId('header-search-input').press('Enter')
    await expect(page.getByTestId('search-count')).toHaveText('5 results for “bre”')

    await page.goBack()
    await expect(page).toHaveURL(`/shows/${IDS.blackwater}`)
    await expect(page.getByTestId('detail-title')).toHaveText('Blackwater Bay')

    await page.goBack()
    await expect(page).toHaveURL('/genres/drama')
    await expect(page.getByTestId('genre-title')).toHaveText('Drama')
    await expect(page.getByTestId('genre-showing')).toHaveText('Showing 24 of 50')

    await page.goBack()
    await expect(page).toHaveURL('/')
    await expect(page.getByTestId('genre-row-drama')).toBeVisible()

    await page.goForward()
    await expect(page).toHaveURL('/genres/drama')

    await page.goForward()
    await expect(page).toHaveURL(`/shows/${IDS.blackwater}`)

    await page.goForward()
    await expect(page).toHaveURL('/search?q=bre')
    await expect(page.getByTestId('search-count')).toHaveText('5 results for “bre”')

    expect(await page.goForward()).toBeNull()
    await expect(page).toHaveURL('/search?q=bre')
  })
})
