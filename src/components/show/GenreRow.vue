<template>
  <section
    :aria-label="row.name"
    :data-test="`genre-row-${row.slug}`"
    class="row"
  >
    <div class="row__head">
      <div class="row__heading">
        <h2
          class="row__title u-display"
          data-test="genre-row-title"
          v-text="row.name"
        />

        <p
          class="row__sub"
          v-text="t('genre.topRated', { count: row.total })"
        />
      </div>

      <router-link
        :to="{ name: 'genre', params: { slug: row.slug } }"
        class="row__see-all"
        data-test="genre-row-see-all"
      >
        <span v-text="t('action.seeAll')" />

        <app-icon
          :size="13"
          name="chevronRight"
        />
      </router-link>
    </div>

    <ul
      ref="track"
      class="row__track u-scroller"
      @scroll.passive="remember"
    >
      <li
        v-for="show in row.shows"
        :key="show.id"
        class="row__item"
      >
        <show-card
          :show="show"
          :genre="row.name"
        />
      </li>
    </ul>
  </section>
</template>

<script lang="ts" setup>
import { useLocale } from '@/locales'
import { RouterLink } from 'vue-router'
import type { GenreRow } from '@/models'
import AppIcon from '@/components/ui/AppIcon.vue'
import ShowCard from '@/components/show/ShowCard.vue'
import { onActivated, onDeactivated, useTemplateRef } from 'vue'

defineOptions({ name: 'GenreRow' })

defineProps<{ row: GenreRow }>()

const { t } = useLocale()
const track = useTemplateRef<HTMLUListElement>('track')

let offset = 0
let restoring = false

function remember(): void {
  if (!restoring) {
    offset = track.value?.scrollLeft ?? 0
  }
}

onActivated(() => {
  if (track.value && offset > 0) {
    restoring = true
    track.value.scrollLeft = offset
    restoring = false
  }
})

onDeactivated(remember)
</script>

<style scoped>
.row {
  display: flex;
  flex-direction: column;
  gap: var(--s-3);
  padding-top: var(--s-4);
}

.row__head {
  display: flex;
  gap: var(--s-4);
  align-items: flex-end;
  justify-content: space-between;
  padding: 0 var(--gutter);
}

.row__title {
  font-size: 24px;
  line-height: 1.05;
}

.row__sub {
  display: none;
  color: var(--ink-2);
  font-size: 12px;
}

.row__see-all {
  display: inline-flex;
  flex: none;
  gap: 3px;
  align-items: center;
  min-height: 44px;
  color: var(--ink-2);
  font-size: 12px;
  font-weight: 600;
}

.row__track {
  display: flex;
  gap: 14px;
  padding: 0 var(--gutter);
  scroll-padding-inline: var(--gutter);
}

.row__item {
  flex: none;
  width: 148px;
  scroll-snap-align: start;
}

@media (min-width: 900px) {
  .row {
    gap: 18px;
    padding-top: 44px;
  }

  .row__title {
    font-size: 38px;
  }

  .row__sub {
    display: block;
  }

  .row__see-all {
    min-height: 0;
    padding: 9px 16px;
    color: var(--ink);
    border: 1px solid var(--line);
    border-radius: var(--r-pill);
  }

  .row__track {
    gap: 20px;
  }

  .row__item {
    width: 202px;
  }
}
</style>
