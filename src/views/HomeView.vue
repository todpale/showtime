<template>
  <div
    class="home"
    data-test="home-view"
  >
    <spotlight-banner
      v-if="desktop && store.spotlight"
      :show="store.spotlight"
    />

    <div
      v-else
      class="home__search"
    >
      <router-link
        :to="{ name: 'search' }"
        class="home__field"
        data-test="home-search-link"
      >
        <app-icon
          :size="17"
          name="search"
        />

        <span v-text="t('search.placeholder')" />
      </router-link>

      <button
        :aria-label="t('filter.open')"
        class="home__filter"
        type="button"
        data-test="home-filter-btn"
        @click="store.openFilters()"
      >
        <app-icon
          :size="18"
          name="slidersHorizontal"
        />
      </button>
    </div>

    <div class="home__chips">
      <p
        v-if="desktop"
        class="u-eyebrow home__chips-label"
        v-text="t('genre.browseBy')"
      />

      <div class="home__chips-track u-scroller">
        <app-chip
          :label="t('genre.all')"
          :active="store.activeGenre === null"
          data-test="genre-chip-all"
          @click="store.selectGenre(null)"
        />

        <app-chip
          v-for="genre in store.genres.slice(0, 10)"
          :key="genre.slug"
          :label="genre.name"
          :active="store.activeGenre === genre.slug"
          :data-test="`genre-chip-${genre.slug}`"
          @click="store.selectGenre(genre.slug)"
        />
      </div>
    </div>

    <div
      v-if="store.status === 'loading'"
      class="home__rows"
      data-test="home-skeleton"
    >
      <skeleton-block
        v-if="desktop"
        class="home__skeleton-spotlight"
        height="420px"
      />

      <div
        v-for="index in 2"
        :key="index"
        class="home__skeleton"
      >
        <skeleton-block
          :width="desktop ? '220px' : '160px'"
          :height="desktop ? '58px' : '30px'"
        />

        <div class="home__skeleton-track">
          <skeleton-block
            v-for="card in (desktop ? 6 : 4)"
            :key="card"
            :width="desktop ? '202px' : '148px'"
            :height="desktop ? '350px' : '260px'"
          />
        </div>
      </div>
    </div>

    <state-block
      v-else-if="store.status === 'error'"
      :title="t('state.error')"
      :hint="store.error ?? t('state.hint')"
      variant="error"
      test="home-error"
      retry
      @on-retry="store.load()"
    />

    <state-block
      v-else-if="store.rows.length === 0"
      :title="t('home.empty')"
      test="home-empty"
    />

    <div
      v-else
      class="home__rows"
    >
      <genre-row
        v-for="row in store.rows"
        :key="row.slug"
        :row="row"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue'
import { useLocale } from '@/locales'
import { RouterLink } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppChip from '@/components/ui/AppChip.vue'
import { useCatalogStore } from '@/stores/catalog'
import GenreRow from '@/components/show/GenreRow.vue'
import StateBlock from '@/components/ui/StateBlock.vue'
import { useDesktop } from '@/composables/useMediaQuery'
import SkeletonBlock from '@/components/ui/SkeletonBlock.vue'
import SpotlightBanner from '@/components/show/SpotlightBanner.vue'

defineOptions({ name: 'HomeView' })

const { t } = useLocale()
const store = useCatalogStore()
const desktop = useDesktop()

onMounted(() => {
  store.load()
})
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  padding-bottom: var(--s-6);
}

.home__search {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: var(--s-2) var(--gutter) 0;
}

.home__field {
  display: flex;
  flex: 1;
  gap: 10px;
  align-items: center;
  height: 48px;
  padding: 0 18px;
  color: var(--ink-2);
  background: var(--surface);
  border-radius: var(--r-pill);
  font-size: 14px;
}

.home__filter {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  color: var(--ink-inv);
  background: var(--ink);
  border-radius: var(--r-pill);
}

.home__chips {
  display: flex;
  gap: var(--s-3);
  align-items: center;
  padding-top: var(--s-3);
}

.home__chips-label {
  flex: none;
  padding-left: var(--gutter);
}

.home__chips-track {
  display: flex;
  gap: var(--s-2);
  align-items: center;
  padding: 0 var(--gutter);
}

.home__rows {
  display: flex;
  flex-direction: column;
}

.home__skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--s-3);
  padding: var(--s-4) var(--gutter) 0;
}

.home__skeleton-track {
  display: flex;
  gap: 14px;
  overflow: hidden;
}

.home__skeleton-spotlight {
  border-radius: 0;
}

@media (min-width: 900px) {
  .home__chips {
    padding-top: var(--s-6);
  }

  .home__skeleton {
    gap: 18px;
    padding-top: 44px;
  }

  .home__skeleton-track {
    gap: 20px;
  }

  .home__chips-track {
    padding-left: var(--s-2);
  }
}
</style>
