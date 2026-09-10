import { test, expect } from './fixtures'
import { IDS, LONG_TITLE } from './fixtures/catalog'
import { box, track, scrollTo, VIEWPORTS, scrollLeft, pageScrollY } from './fixtures/dom'

const EPISODES = '[data-test^="episode-card-"]'
const NIGHTFALL_META = '2024 · 3 seasons · 30 episodes · Running · Drama, Crime, Mystery'

test.describe('Show detail at mobile', () => {
  test.use({ viewport: VIEWPORTS.mobile, permissions: ['clipboard-read', 'clipboard-write'] })

  test('E2E-DETAIL-01 detail screen shows complete show information', async ({ page }) => {
    await page.goto(`/shows/${IDS.nightfall}`)

    const hero = page.getByTestId('detail-hero')

    await expect(hero.getByRole('img', { name: 'Nightfall County' })).toBeVisible()
    await expect(page.getByTestId('detail-title')).toHaveText('Nightfall County')
    await expect(hero.getByTestId('show-card-rating')).toHaveText('9.4')
    await expect(page.getByTestId('detail-meta')).toHaveText(NIGHTFALL_META)
    await expect(page.getByTestId('detail-synopsis')).toContainText('Nightfall County follows')
    await expect(page.getByTestId('detail-synopsis')).toContainText('Starring Maren Okafor, Diego Salas, Ruth Kellaway')
  })

  test('E2E-DETAIL-02 an episode card opens the episode modal', async ({ page }) => {
    await page.goto(`/shows/${IDS.nightfall}`)

    const episodes = page.getByTestId('detail-episodes').locator(EPISODES)
    const modal = page.getByTestId('episode-modal')

    await expect(modal).toHaveCount(0)

    await episodes.first().click()

    await expect(modal).toBeVisible()
    await expect(modal.getByTestId('episode-modal-title')).toHaveText('Ash Wednesday')
    await expect(modal.getByTestId('episode-modal-code')).toHaveText('S1:E1 · 58m')
    await expect(modal.getByTestId('episode-modal-summary')).toContainText('the story continues')
    await expect(page).toHaveURL(`/shows/${IDS.nightfall}`)

    await modal.getByTestId('episode-modal-close-btn').click()

    await expect(modal).toHaveCount(0)

    await episodes.nth(1).click()

    await expect(modal.getByTestId('episode-modal-title')).toHaveText('The Long Field')

    await modal.getByTestId('episode-modal-scrim-btn').click()

    await expect(modal).toHaveCount(0)
  })

  test('E2E-DETAIL-04 add to list toggles and persists', async ({ page }) => {
    await page.goto(`/shows/${IDS.nightfall}`)

    const add = page.getByTestId('detail-add-btn')

    await expect(add).toHaveAttribute('aria-pressed', 'false')

    await add.click()

    await expect(add).toHaveAttribute('aria-pressed', 'true')

    await page.getByTestId('bottom-nav-list').click()

    await expect(page).toHaveURL('/list')
    await expect(page.getByTestId('list-grid').getByTestId(`show-card-${IDS.nightfall}`)).toBeVisible()

    await page.goto(`/shows/${IDS.nightfall}`)

    await expect(add).toHaveAttribute('aria-pressed', 'true')

    await add.click()

    await expect(add).toHaveAttribute('aria-pressed', 'false')

    await page.getByTestId('bottom-nav-list').click()

    await expect(page.getByTestId('list-empty')).toBeVisible()
    await expect(page.getByTestId('list-grid')).toHaveCount(0)
  })

  test('E2E-DETAIL-05 share copies a link to this show', async ({ page }) => {
    await page.goto(`/shows/${IDS.nightfall}`)
    await expect(page.getByTestId('detail-title')).toHaveText('Nightfall County')

    await page.getByTestId('detail-share-btn').click()

    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(`http://localhost:5173/shows/${IDS.nightfall}`)
  })

  test('E2E-DETAIL-06 tabs switch content without navigation', async ({ page }) => {
    await page.goto(`/shows/${IDS.nightfall}`)

    await expect(page.getByTestId('detail-tab-episodes')).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('detail-episodes')).toBeVisible()

    await page.getByTestId('detail-tab-details').click()

    await expect(page.getByTestId('detail-tab-details')).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('detail-tab-episodes')).toHaveAttribute('aria-selected', 'false')
    await expect(page.getByTestId('detail-details')).toBeVisible()
    await expect(page.getByTestId('detail-details')).toContainText('Drama, Crime, Mystery')
    await expect(page.getByTestId('detail-episodes')).toHaveCount(0)
    await expect(page).toHaveURL(`/shows/${IDS.nightfall}`)

    await page.getByTestId('detail-tab-similar').click()

    await expect(page.getByTestId('detail-tab-similar')).toHaveAttribute('aria-selected', 'true')

    const similar = page.getByTestId('detail-similar').locator('a[data-test^="show-card-"]')

    await expect(similar).toHaveCount(6)
    await expect(page.getByTestId('detail-similar').getByTestId(`show-card-${IDS.nightfall}`)).toHaveCount(0)
    await expect(similar.first().getByTestId('show-card-title')).toHaveText('Ashfall County')

    await similar.first().click()

    await expect(page).toHaveURL(`/shows/${IDS.ashfall}`)
    await expect(page.getByTestId('detail-title')).toHaveText('Ashfall County')
  })

  test('E2E-DETAIL-07 episode list matches the selected season', async ({ page }) => {
    await page.goto(`/shows/${IDS.nightfall}`)

    await expect(page.getByTestId('detail-season-select')).toHaveValue('1')
    await expect(page.getByTestId('detail-episode-count')).toHaveText('10 episodes')

    const episodes = page.getByTestId('detail-episodes').locator(EPISODES)

    await expect(episodes).toHaveCount(10)
    await expect(episodes.first()).toContainText('S1:E1 · 58m')
    await expect(episodes.first()).toContainText('Ash Wednesday')
    await expect(episodes.nth(1)).toContainText('The Long Field')
    await expect(episodes.nth(3)).toContainText('S1:E4 · 56m')

    const numbers = await episodes.evaluateAll((elements) => elements
      .map((element) => Number(element.getAttribute('data-test')?.replace('episode-card-', ''))))

    expect(numbers).toEqual([1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10])

    for (const episode of await episodes.all()) {
      await expect(episode.getByTestId('poster-div')).toBeVisible()
      await expect(episode).toContainText(/S1:E\d+ · \d+m/)
      await expect(episode.getByRole('heading')).not.toBeEmpty()
      await expect(episode).toContainText('the story continues')
    }
  })

  test('E2E-DETAIL-08 season switching', async ({ page }) => {
    await page.goto(`/shows/${IDS.nightfall}`)

    const select = page.getByTestId('detail-season-select')

    await expect(select.locator('option:checked')).toHaveText('Season 1')

    await select.selectOption('3')

    await expect(select).toHaveValue('3')
    await expect(select.locator('option:checked')).toHaveText('Season 3')
    await expect(page.getByTestId('detail-episode-count')).toHaveText('10 episodes')
    await expect(page.getByTestId('detail-episodes').locator(EPISODES).first()).toContainText('S3:E1')
    await expect(page.getByTestId('detail-episodes')).not.toContainText('S1:E1')
  })

  test('E2E-DETAIL-09 show with no episodes', async ({ page }) => {
    await page.goto(`/shows/${IDS.noSeasons}`)

    await expect(page.getByTestId('detail-title')).toHaveText('Standing Stone')
    await expect(page.getByTestId('detail-episodes-empty')).toContainText('No episodes are listed')
    await expect(page.getByTestId('detail-season-select')).toHaveCount(0)
    await expect(page.getByTestId('detail-episodes').locator(EPISODES)).toHaveCount(0)
    await expect(page.getByTestId('episode-modal')).toHaveCount(0)
    expect((await box(page.getByTestId('detail-hero'))).height).toBeGreaterThan(200)
    expect((await box(page.getByTestId('detail-episodes'))).height).toBeGreaterThan(0)
  })

  test('E2E-DETAIL-10 back returns to the originating screen', async ({ page }) => {
    await page.goto('/')

    const sports = page.getByTestId('genre-row-sports')

    await sports.scrollIntoViewIfNeeded()
    await scrollTo(track(sports), 200)

    const scrolled = await pageScrollY(page)
    const offset = await scrollLeft(track(sports))

    expect(scrolled).toBeGreaterThan(0)
    expect(offset).toBeGreaterThan(0)

    await sports.getByTestId(`show-card-${IDS.fullCount}`).click()
    await expect(page.getByTestId('detail-title')).toHaveText('Full Count')
    await page.getByTestId('detail-back-btn').click()

    await expect(page).toHaveURL('/')
    await expect(page.getByTestId('genre-row-sports')).toBeVisible()
    const softly = expect.configure({ soft: true })

    await softly.poll(() => pageScrollY(page), 'vertical scroll position is restored').toBe(0)
    await softly.poll(() => scrollLeft(track(page.getByTestId('genre-row-sports'))), 'row offset is restored')
      .toBe(0)

    await page.goto('/search?q=bre')
    await page.getByTestId('search-top-result').click()
    await expect(page.getByTestId('detail-title')).toHaveText('Bright Hollow')
    await page.getByTestId('detail-back-btn').click()

    await expect(page).toHaveURL('/search?q=bre')
    await expect(page.getByTestId('search-input')).toHaveValue('bre')
  })

  test('E2E-DETAIL-11 deep link', async ({ page }) => {
    await page.goto(`/shows/${IDS.nightfall}`)

    await expect(page.getByTestId('detail-title')).toHaveText('Nightfall County')
    await expect(page.getByTestId('detail-meta')).toHaveText(NIGHTFALL_META)
    await expect(page.getByTestId('detail-episodes').locator(EPISODES)).toHaveCount(10)

    await page.getByTestId('detail-back-btn').click()

    await expect(page).toHaveURL('/')
    await expect(page.getByTestId('home-view')).toBeVisible()
    await expect(page.getByTestId('genre-row-drama')).toBeVisible()
  })

  test('E2E-DETAIL-13 long title does not break the hero at mobile', async ({ page }) => {
    await page.goto(`/shows/${IDS.longTitle}`)
    await expect(page.getByTestId('detail-title')).toHaveText(LONG_TITLE)

    const hero = await box(page.getByTestId('detail-hero'))
    const title = await box(page.getByTestId('detail-title'))
    const meta = await box(page.getByTestId('detail-meta'))
    const add = await box(page.getByTestId('detail-add-btn'))
    const overflow = await page.getByTestId('detail-title')
      .evaluate((element) => element.scrollWidth - element.clientWidth)

    expect(title.x).toBeGreaterThanOrEqual(hero.x)
    expect(title.x + title.width).toBeLessThanOrEqual(hero.x + hero.width)
    expect(title.y + title.height).toBeLessThanOrEqual(hero.y + hero.height)
    expect(title.y + title.height).toBeLessThanOrEqual(meta.y + 1)
    expect(meta.y + meta.height).toBeLessThanOrEqual(add.y + 1)
    expect(overflow).toBeLessThanOrEqual(0)
  })
})

test.describe('Show detail at desktop', () => {
  test.use({ viewport: VIEWPORTS.desktop })

  test('E2E-DETAIL-01 desktop hero shows synopsis and credits inline', async ({ page }) => {
    await page.goto(`/shows/${IDS.nightfall}`)

    await expect(page.getByTestId('detail-title')).toHaveText('Nightfall County')
    await expect(page.getByTestId('detail-meta')).toHaveText(NIGHTFALL_META)
    await expect(page.getByTestId('detail-summary')).toContainText('Nightfall County follows')
    await expect(page.getByTestId('detail-starring')).toHaveText('Maren Okafor, Diego Salas, Ruth Kellaway')
    await expect(page.getByTestId('detail-creators')).toHaveText('Anna Petrossian, Wes Bramwell')
  })

  test('E2E-DETAIL-12 desktop detail layout', async ({ page }) => {
    await page.goto(`/shows/${IDS.nightfall}`)
    await expect(page.getByTestId('detail-title')).toHaveText('Nightfall County')

    const poster = await box(page.getByTestId('detail-hero').getByTestId('poster-div'))
    const title = await box(page.getByTestId('detail-title'))

    expect(poster.x + poster.width).toBeLessThanOrEqual(title.x)
    expect(poster.y).toBeLessThan(title.y + title.height)
    expect(poster.y + poster.height).toBeGreaterThan(title.y)

    const episodes = page.getByTestId('detail-episodes').locator(EPISODES)
    const first = await box(episodes.nth(0))
    const second = await box(episodes.nth(1))
    const fifth = await box(episodes.nth(4))

    expect(second.y).toBe(first.y)
    expect(second.x).toBeGreaterThan(first.x)
    expect(fifth.y).toBeGreaterThan(first.y)

    const tabs = page.getByRole('tab')

    await expect(tabs).toHaveCount(4)

    const tabBoxes = await Promise.all((await tabs.all()).map((tab) => box(tab)))

    for (const tab of tabBoxes) {
      expect(tab.y).toBe(tabBoxes[0]?.y)
      expect(tab.x + tab.width).toBeLessThanOrEqual(VIEWPORTS.desktop.width)
    }
  })

  test('E2E-DETAIL-13 long title does not break the hero at desktop', async ({ page }) => {
    await page.goto(`/shows/${IDS.longTitle}`)
    await expect(page.getByTestId('detail-title')).toHaveText(LONG_TITLE)

    const hero = await box(page.getByTestId('detail-hero'))
    const title = await box(page.getByTestId('detail-title'))
    const meta = await box(page.getByTestId('detail-meta'))
    const add = await box(page.getByTestId('detail-add-btn'))

    expect(title.x + title.width).toBeLessThanOrEqual(hero.x + hero.width)
    expect(title.y + title.height).toBeLessThanOrEqual(hero.y + hero.height)
    expect(title.y + title.height).toBeLessThanOrEqual(meta.y + 1)
    expect(meta.y + meta.height).toBeLessThanOrEqual(add.y + 1)
  })
})
