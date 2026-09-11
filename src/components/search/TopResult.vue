<template>
  <router-link
    :to="{ name: 'show', params: { id: result.id } }"
    class="top"
    data-test="search-top-result"
  >
    <div class="top__poster">
      <poster-image
        :src="result.poster"
        :alt="result.name"
      />
    </div>

    <div class="top__info">
      <span
        class="top__badge"
        v-text="t('search.top')"
      />

      <h2
        class="top__title u-display"
        v-text=" result.name"
      />

      <p
        class="top__meta"
        v-text="meta"
      />

      <p
        v-if="result.summary"
        class="top__desc"
        v-text="result.summary"
      />
    </div>

    <div
      class="top__rating"
      data-test="search-top-rating"
    >
      <app-icon
        :size="14"
        name="star"
        filled
      />

      <span
        class="top__score"
        v-text="ratingText(result.rating)"
      />
    </div>
  </router-link>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useLocale } from '@/locales'
import { RouterLink } from 'vue-router'
import type { SearchResult } from '@/models'
import AppIcon from '@/components/ui/AppIcon.vue'
import { joinMeta, ratingText } from '@/utils/format'
import PosterImage from '@/components/ui/PosterImage.vue'

defineOptions({ name: 'TopResult' })

const props = defineProps<{ result: SearchResult }>()

const { t } = useLocale()

const meta = computed((): string => joinMeta([
  props.result.genres.slice(0, 2).join(' '),
  props.result.year === null ? null : String(props.result.year),
  props.result.network
]))
</script>

<style scoped>
.top {
  display: flex;
  gap: 14px;
  align-items: center;
  padding: var(--s-3);
  background: var(--surface);
  border-radius: var(--r-card);
}

.top__poster {
  flex: none;
  width: 74px;
}

.top__info {
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
}

.top__badge {
  align-self: flex-start;
  padding: 3px 8px;
  color: var(--ink);
  text-transform: uppercase;
  background: var(--accent);
  border-radius: var(--r-pill);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.1em;
}

.top__title {
  font-size: 26px;
  line-height: 1.1;
}

.top__meta {
  color: var(--ink-2);
  font-size: 11px;
  letter-spacing: 0.02em;
}

.top__desc {
  overflow: hidden;
  display: none;
  color: var(--ink-2);
  font-size: 13px;
  line-height: 1.55;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.top__rating {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: 3px;
  align-items: center;
}

.top__score {
  font-size: 15px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

@media (min-width: 900px) {
  .top {
    gap: 22px;
    align-items: flex-start;
    padding: 20px;
    border-radius: 10px;
  }

  .top__poster {
    width: 152px;
  }

  .top__info {
    gap: 10px;
  }

  .top__title {
    font-size: 44px;
  }

  .top__meta {
    font-size: 13px;
  }

  .top__desc {
    display: -webkit-box;
    max-width: 480px;
  }
}
</style>
