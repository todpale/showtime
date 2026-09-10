import type { ShowSummary } from '@/models'

function ratingText(rating: number | null): string {
  return rating === null ? '—' : rating.toFixed(1)
}

function metaParts(show: ShowSummary): string[] {
  const parts: string[] = []

  if (show.genres.length > 0) {
    parts.push(show.genres.slice(0, 2).join(', '))
  }

  if (show.year !== null) {
    parts.push(String(show.year))
  }

  return parts
}

function joinMeta(parts: (string | null | undefined)[]): string {
  return parts.filter((part): part is string => Boolean(part)).join(' · ')
}

export { joinMeta, metaParts, ratingText }
