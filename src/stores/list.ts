import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { ShowSummary } from '@/models'
import { readJson, writeJson } from '@/utils/storage'

const LIST_KEY = 'showtime.my-list'

const useListStore = defineStore('list', () => {
  const shows = ref<ShowSummary[]>(readJson<ShowSummary[]>(LIST_KEY, []))

  const count = computed(() => shows.value.length)
  const ids = computed(() => new Set(shows.value.map((show) => show.id)))

  function has(id: number): boolean {
    return ids.value.has(id)
  }

  function persist(): void {
    writeJson(LIST_KEY, shows.value)
  }

  function add(show: ShowSummary): void {
    if (has(show.id)) {
      return
    }

    shows.value = [...shows.value, show]
    persist()
  }

  function remove(id: number): void {
    shows.value = shows.value.filter((show) => show.id !== id)
    persist()
  }

  function toggle(show: ShowSummary): void {
    if (has(show.id)) {
      remove(show.id)
      return
    }

    add(show)
  }

  return { ids, count, shows, add, has, remove, toggle }
})

export { useListStore }
