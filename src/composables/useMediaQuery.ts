import type { Ref } from 'vue'
import { ref, onMounted, onUnmounted } from 'vue'

const DESKTOP = '(min-width: 900px)'

function useMediaQuery(query: string): Ref<boolean> {
  const matches = ref(typeof window === 'undefined' ? false : window.matchMedia(query).matches)
  let list: MediaQueryList | null = null

  function update(event: MediaQueryList | MediaQueryListEvent): void {
    matches.value = event.matches
  }

  onMounted(() => {
    list = window.matchMedia(query)
    update(list)
    list.addEventListener('change', update)
  })

  onUnmounted(() => {
    list?.removeEventListener('change', update)
  })

  return matches
}

function useDesktop(): Ref<boolean> {
  return useMediaQuery(DESKTOP)
}

export { useDesktop, useMediaQuery }
