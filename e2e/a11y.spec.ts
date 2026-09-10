import { IDS } from './fixtures/catalog'
import { test, expect } from './fixtures'
import { box, track, VIEWPORTS, scrollLeft, contrastRatio, focusedTestId } from './fixtures/dom'

const HEADER_ORDER = [
  'header-nav-home',
  'header-nav-genres',
  'header-nav-list',
  'header-wordmark',
  'header-search-input',
  'header-filter-btn',
  'spotlight-watch-btn',
  'spotlight-list-btn',
  'genre-chip-all',
  'genre-chip-drama'
]

test.describe('Accessibility at desktop', () => {
  test.use({ viewport: VIEWPORTS.desktop })

  test('E2E-A11Y-01 keyboard navigation', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('genre-row-drama')).toBeVisible()

    const order: (string | null)[] = []
    const outlines: string[] = []

    for (let index = 0; index < HEADER_ORDER.length; index += 1) {
      await page.keyboard.press('Tab')
      order.push(await focusedTestId(page))
      outlines.push(await page.evaluate(() => {
        const style = getComputedStyle(document.activeElement as Element)

        return `${style.outlineStyle}:${style.outlineWidth}`
      }))
    }

    expect(order).toEqual(HEADER_ORDER)
    expect(outlines.every((outline) => outline !== 'none:0px')).toBe(true)

    const drama = page.getByTestId('genre-row-drama')
    const lastRow = page.locator('section[data-test^="genre-row-"]').last()
    const lastCard = lastRow.locator('a[data-test^="show-card-"]').last()

    await drama.getByTestId('genre-row-see-all').focus()
    await page.keyboard.press('Tab')
    expect(await focusedTestId(page)).toBe(`show-card-${IDS.nightfall}`)

    await lastCard.focus()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('app-footer').locator(':focus')).toHaveCount(1)

    await drama.getByTestId(`show-card-${IDS.nightfall}`).focus()
    await page.keyboard.press('Enter')

    await expect(page).toHaveURL(`/shows/${IDS.nightfall}`)
    await expect(page.getByTestId('detail-title')).toHaveText('Nightfall County')
  })

  test('E2E-A11Y-02 horizontal rows are keyboard-scrollable', async ({ page }) => {
    await page.goto('/')

    const drama = page.getByTestId('genre-row-drama')
    const list = track(drama)

    await drama.getByTestId(`show-card-${IDS.nightfall}`)
      .evaluate((element) => (element as HTMLElement).focus({ preventScroll: true }))
    expect(await focusedTestId(page)).toBe(`show-card-${IDS.nightfall}`)

    const baseline = await scrollLeft(list)

    for (let index = 0; index < 11; index += 1) {
      await page.keyboard.press('Tab')
    }

    expect(await focusedTestId(page)).toBe('show-card-12')
    await expect.poll(() => scrollLeft(list)).toBeGreaterThan(baseline)

    const card = await box(drama.getByTestId('show-card-12'))
    const viewport = await box(list)

    expect(card.x).toBeGreaterThanOrEqual(viewport.x)
    expect(card.x + card.width).toBeLessThanOrEqual(viewport.x + viewport.width + 1)
  })

  test('E2E-A11Y-07 the filter dialog is keyboard operable', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('genre-row-drama')).toBeVisible()

    await page.getByTestId('header-filter-btn').click()

    const sheet = page.getByTestId('filter-sheet')

    await expect(sheet).toHaveCount(1)
    await expect(sheet.getByTestId('filter-close-btn')).toBeFocused()
    await expect(sheet.getByTestId('filter-close-btn')).toHaveAccessibleName('Close')
    await expect(sheet.getByTestId('filter-sheet-scrim-btn')).toHaveAccessibleName('Close')
    await expect(sheet.getByTestId('filter-reset-btn')).toHaveAccessibleName('Reset filters')

    await page.keyboard.press('Escape')

    await expect(page.getByTestId('filter-sheet')).toHaveCount(0)
  })
})

test.describe('Accessibility at mobile', () => {
  test.use({ viewport: VIEWPORTS.mobile })

  test('E2E-A11Y-03 screen-reader semantics', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('region', { name: 'Drama' })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Comedy' })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Sports' })).toBeVisible()

    const card = page.getByRole('region', { name: 'Drama' }).getByTestId(`show-card-${IDS.nightfall}`)

    await expect(card).toHaveAccessibleName(/Nightfall County/)
    await expect(card).toHaveAccessibleName(/Drama · 2024/)
    await expect(card).toHaveAccessibleName(/9\.4 \/ 10/)
    await expect(card.getByTestId('show-card-rating')).toHaveAttribute('aria-label', '9.4 / 10')
    await expect(page.getByTestId('bottom-nav-home')).toHaveAttribute('aria-current', 'page')

    await page.getByTestId('bottom-nav-search').click()

    await expect(page.getByTestId('search-input')).toHaveAccessibleName('Search shows by name')
    await expect(page.getByTestId('bottom-nav-search')).toHaveAttribute('aria-current', 'page')

    await page.goto(`/shows/${IDS.nightfall}`)

    await expect(page.getByRole('tab', { name: 'Episodes' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('tab', { selected: true })).toHaveCount(1)
  })

  test('E2E-A11Y-04 images have alternatives', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('genre-row-drama')).toBeVisible()

    const cardImages = await page.locator('a[data-test^="show-card-"]').evaluateAll((cards) => cards.map((card) => ({
      alt: card.querySelector('img')?.getAttribute('alt') ?? '',
      title: card.querySelector('[data-test="show-card-title"]')?.textContent?.trim() ?? ''
    })))

    expect(cardImages.length).toBeGreaterThan(20)
    expect(cardImages.every((entry) => entry.alt !== '' && entry.alt === entry.title)).toBe(true)

    await page.goto(`/shows/${IDS.nightfall}`)
    await expect(page.getByTestId('detail-episodes')).toBeVisible()

    await expect(page.getByTestId('detail-hero').getByRole('img', { name: 'Nightfall County' })).toBeVisible()

    const stills = await page.locator('[data-test^="episode-card-"]').evaluateAll((cards) => cards.map((card) => ({
      alt: card.querySelector('img')?.getAttribute('alt') ?? '',
      title: card.querySelector('h3')?.textContent?.trim() ?? ''
    })))

    expect(stills).toHaveLength(10)
    expect(stills.every((entry) => entry.alt !== '' && entry.alt === entry.title)).toBe(true)
    await expect(page.locator('img:not([alt]), img[alt=""]')).toHaveCount(0)
  })

  test('E2E-A11Y-05 colour contrast', async ({ page }) => {
    await page.goto('/')

    const drama = page.getByTestId('genre-row-drama')

    expect(await contrastRatio(drama.getByTestId('show-card-meta').first())).toBeGreaterThanOrEqual(4.5)
    expect(await contrastRatio(drama.getByTestId('show-card-title').first())).toBeGreaterThanOrEqual(4.5)
    expect(await contrastRatio(drama.getByTestId('show-card-rating').first())).toBeGreaterThanOrEqual(4.5)
    expect(await contrastRatio(page.getByTestId('genre-chip-drama'))).toBeGreaterThanOrEqual(4.5)
    expect(await contrastRatio(page.getByTestId('genre-chip-all'))).toBeGreaterThanOrEqual(4.5)
    expect(await contrastRatio(page.getByTestId('home-search-link'))).toBeGreaterThanOrEqual(4.5)

    await page.goto('/genres/drama')

    expect(await contrastRatio(page.getByTestId('genre-subtitle'))).toBeGreaterThanOrEqual(4.5)
    expect(await contrastRatio(page.getByTestId('genre-showing'))).toBeGreaterThanOrEqual(4.5)

    await page.goto('/search?q=bre')

    expect(await contrastRatio(page.getByTestId('search-count'))).toBeGreaterThanOrEqual(4.5)
    expect(await contrastRatio(page.getByTestId('search-result-rating').first())).toBeGreaterThanOrEqual(4.5)
  })
})
