<template>
  <div
    class="app"
    data-test="app-div"
  >
    <app-header @filters="catalog.openFilters()" />

    <main
      class="app__main"
      data-test="app-main"
    >
      <router-view v-slot="{ Component }">
        <keep-alive include="HomeView">
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </main>

    <app-footer v-if="desktop" />

    <bottom-nav v-else />

    <filter-sheet
      v-if="catalog.filtersOpen"
      @on-close="catalog.closeFilters()"
    />
  </div>
</template>

<script lang="ts" setup>
import { RouterView } from 'vue-router'
import { useCatalogStore } from '@/stores/catalog'
import { useDesktop } from '@/composables/useMediaQuery'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import BottomNav from '@/components/layout/BottomNav.vue'
import FilterSheet from '@/components/genre/FilterSheet.vue'

defineOptions({ name: 'App' })

const desktop = useDesktop()
const catalog = useCatalogStore()
</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app__main {
  flex: 1;
  min-width: 0;
}
</style>
