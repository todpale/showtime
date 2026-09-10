<template>
  <router-link
    :to="{ name: 'show', params: { id: result.id } }"
    :data-test="`search-result-row-${index}`"
    class="result"
  >
    <div class="result__thumb">
      <poster-image
        :src="result.poster"
        :alt="result.name"
      />
    </div>

    <div class="result__info">
      <h3 class="result__title">
        {{ result.name }}
      </h3>

      <p
        class="result__meta"
        v-text="meta"
      />
    </div>

    <span
      class="result__rating"
      data-test="search-result-rating"
    >
      <app-icon
        :size="12"
        name="star"
        filled
      />

      <span
        class="result__score"
        v-text="ratingText(result.rating)"
      />
    </span>
  </router-link>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { SearchResult } from '@/models'
import AppIcon from '@/components/ui/AppIcon.vue'
import { joinMeta, ratingText } from '@/utils/format'
import PosterImage from '@/components/ui/PosterImage.vue'

defineOptions({ name: 'ResultRow' })

const props = defineProps<{ index: number; result: SearchResult, }>()

const meta = computed((): string => joinMeta([
  props.result.genres.slice(0, 2).join(' '),
  props.result.year === null ? null : String(props.result.year),
  props.result.network
]))
</script>

<style scoped>
.result {
  display: flex;
  gap: 14px;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid var(--line);
}

.result__thumb {
  flex: none;
  width: 52px;
}

.result__info {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.result__title {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.2;
}

.result__meta {
  overflow: hidden;
  color: var(--ink-2);
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  letter-spacing: 0.02em;
}

.result__rating {
  display: flex;
  flex: none;
  gap: var(--s-1);
  align-items: center;
  color: var(--ink-2);
}

.result__score {
  color: var(--ink);
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

@media (min-width: 900px) {
  .result {
    gap: 18px;
  }

  .result__thumb {
    width: 62px;
  }

  .result__title {
    font-size: 16px;
  }

  .result__meta {
    font-size: 12px;
  }
}
</style>
