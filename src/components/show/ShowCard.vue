<template>
  <router-link
    :to="{ name: 'show', params: { id: show.id } }"
    :data-test="`show-card-${show.id}`"
    class="card"
  >
    <div class="card__poster">
      <poster-image
        :src="show.poster"
        :alt="show.name"
      />

      <rating-pill
        :rating="show.rating"
        class="card__rating"
      />
    </div>

    <div class="card__info">
      <h3
        class="card__title"
        data-test="show-card-title"
      >
        {{ show.name }}
      </h3>

      <p
        class="card__meta"
        data-test="show-card-meta"
        v-text="meta"
      />
    </div>
  </router-link>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { joinMeta } from '@/utils/format'
import type { ShowSummary } from '@/models'
import RatingPill from '@/components/ui/RatingPill.vue'
import PosterImage from '@/components/ui/PosterImage.vue'

defineOptions({ name: 'ShowCard' })

const props = withDefaults(defineProps<{ genre?: string, show: ShowSummary }>(), { genre: '' })

const meta = computed((): string => {
  const genre = props.genre || props.show.genres[0] || props.show.type

  return joinMeta([genre, props.show.year === null ? null : String(props.show.year)])
})
</script>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.card__poster {
  position: relative;
}

.card__rating {
  position: absolute;
  top: var(--s-2);
  left: var(--s-2);
}

.card__info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.card__title {
  overflow: hidden;
  display: -webkit-box;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.25;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.card__meta {
  overflow: hidden;
  color: var(--ink-2);
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  letter-spacing: 0.02em;
}

.card:hover .card__title {
  text-decoration: underline;
  text-underline-offset: 2px;
}

@media (min-width: 900px) {
  .card__title {
    font-size: 15px;
  }

  .card__meta {
    font-size: 12px;
  }

  .card__rating {
    top: 10px;
    left: 10px;
  }
}
</style>
