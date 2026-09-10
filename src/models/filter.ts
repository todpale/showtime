type SortKey = 'rating' | 'year' | 'name' | 'relevance'

interface SortOption {
  key: SortKey
  label: string
}

interface RatingStep {
  label: string
  value: number | null
}

interface CatalogFilters {
  year: number | null
  genre: string | null
  minRating: number | null
}

export type { SortKey, SortOption, RatingStep, CatalogFilters }
