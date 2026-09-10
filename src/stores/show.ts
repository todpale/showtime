import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { apiGet } from '@/utils/api'
import type { Episode, DetailTab, ShowDetail, LoadStatus, EpisodeGroup } from '@/models'

const useShowStore = defineStore('show', () => {
  const detail = ref<ShowDetail | null>(null)
  const groups = ref<EpisodeGroup[]>([])
  const season = ref(1)
  const tab = ref<DetailTab>('episodes')
  const selected = ref<Episode | null>(null)
  const status = ref<LoadStatus>('idle')
  const error = ref<string | null>(null)

  const seasons = computed(() => groups.value.map((group) => group.season))
  const episodes = computed(() => groups.value.find((group) => group.season === season.value)?.episodes ?? [])

  async function open(id: number): Promise<void> {
    if (detail.value?.id === id && status.value === 'ready') {
      return
    }

    status.value = 'loading'
    error.value = null
    selected.value = null
    tab.value = 'episodes'

    try {
      const [show, episodeGroups] = await Promise.all([
        apiGet<ShowDetail>(`/shows/${id}`),
        apiGet<EpisodeGroup[]>(`/shows/${id}/episodes`)
      ])

      detail.value = show
      groups.value = episodeGroups
      season.value = episodeGroups[0]?.season ?? 1
      status.value = 'ready'
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : String(cause)
      status.value = 'error'
    }
  }

  function setSeason(next: number): void {
    season.value = next
    selected.value = null
  }

  function setTab(next: DetailTab): void {
    tab.value = next
  }

  function select(episode: Episode | null): void {
    selected.value = episode
  }

  return {
    tab,
    error,
    season,
    detail,
    groups,
    status,
    seasons,
    selected,
    episodes,
    open,
    select,
    setTab,
    setSeason
  }
})

export { useShowStore }
