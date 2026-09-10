import type { IconName } from '@/models'
import xSvg from '@/assets/icons/x.svg?raw'
import starSvg from '@/assets/icons/star.svg?raw'
import userSvg from '@/assets/icons/user.svg?raw'
import menuSvg from '@/assets/icons/menu.svg?raw'
import playSvg from '@/assets/icons/play.svg?raw'
import plusSvg from '@/assets/icons/plus.svg?raw'
import houseSvg from '@/assets/icons/house.svg?raw'
import shareSvg from '@/assets/icons/share-2.svg?raw'
import searchSvg from '@/assets/icons/search.svg?raw'
import ellipsisSvg from '@/assets/icons/ellipsis.svg?raw'
import bookmarkSvg from '@/assets/icons/bookmark.svg?raw'
import downloadSvg from '@/assets/icons/download.svg?raw'
import arrowLeftSvg from '@/assets/icons/arrow-left.svg?raw'
import arrowRightSvg from '@/assets/icons/arrow-right.svg?raw'
import chevronDownSvg from '@/assets/icons/chevron-down.svg?raw'
import chevronLeftSvg from '@/assets/icons/chevron-left.svg?raw'
import chevronRightSvg from '@/assets/icons/chevron-right.svg?raw'
import slidersHorizontalSvg from '@/assets/icons/sliders-horizontal.svg?raw'
import arrowDownWideNarrowSvg from '@/assets/icons/arrow-down-wide-narrow.svg?raw'

const toInnerMarkup = (source: string): string => source
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/^[\s\S]*?<svg\b[^>]*>/, '')
  .replace(/<\/svg>[\s\S]*$/, '')
  .replace(/\s*\n\s*/g, '')
  .trim()

const ICON_PATHS: Record<IconName, string> = {
  x: toInnerMarkup(xSvg),
  star: toInnerMarkup(starSvg),
  user: toInnerMarkup(userSvg),
  menu: toInnerMarkup(menuSvg),
  play: toInnerMarkup(playSvg),
  plus: toInnerMarkup(plusSvg),
  house: toInnerMarkup(houseSvg),
  share: toInnerMarkup(shareSvg),
  search: toInnerMarkup(searchSvg),
  ellipsis: toInnerMarkup(ellipsisSvg),
  bookmark: toInnerMarkup(bookmarkSvg),
  download: toInnerMarkup(downloadSvg),
  arrowLeft: toInnerMarkup(arrowLeftSvg),
  arrowRight: toInnerMarkup(arrowRightSvg),
  chevronDown: toInnerMarkup(chevronDownSvg),
  chevronLeft: toInnerMarkup(chevronLeftSvg),
  chevronRight: toInnerMarkup(chevronRightSvg),
  sortDescending: toInnerMarkup(arrowDownWideNarrowSvg),
  slidersHorizontal: toInnerMarkup(slidersHorizontalSvg)
}

export { ICON_PATHS }
