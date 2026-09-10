<template>
  <div
    class="genres"
    data-test="genres-view"
  >
    <h1
      class="genres__title u-display"
      v-text=" t('genre.browse')"
    />

    <ul
      class="genres__grid"
      data-test="genres-grid"
    >
      <li
        v-for="genre in store.genres"
        :key="genre.slug"
      >
        <router-link
          :to="{ name: 'genre', params: { slug: genre.slug } }"
          :data-test="`genre-tile-${genre.slug}`"
          class="genres__tile"
        >
          <span
            class="genres__name"
            v-text="genre.name"
          />

          <span
            class="genres__count"
            v-text="t('genre.count', { count: genre.total }, genre.total)"
          />
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue'
import { useLocale } from '@/locales'
import { RouterLink } from 'vue-router'
import { useCatalogStore } from '@/stores/catalog'

defineOptions({ name: 'GenresView' })

const { t } = useLocale()
const store = useCatalogStore()

onMounted(() => {
  store.loadGenres()
})
</script>

<style scoped>
.genres {
  display: flex;
  flex-direction: column;
  gap: var(--s-5);
  padding: var(--s-5) var(--gutter) var(--s-6);
}

.genres__title {
  font-size: 48px;
  line-height: 1.02;
}

.genres__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: var(--s-3);
}

.genres__tile {
  display: flex;
  flex-direction: column;
  gap: var(--s-1);
  padding: var(--s-4);
  background: var(--surface);
  border-radius: var(--r-card);
}

.genres__tile:hover {
  background: var(--surface-2);
}

.genres__name {
  font-size: 15px;
  font-weight: 600;
}

.genres__count {
  color: var(--ink-2);
  font-size: 12px;
}
</style>
