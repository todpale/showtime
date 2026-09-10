<template>
  <component
    :is="selectable ? 'button' : 'div'"
    :type="selectable ? 'button' : undefined"
    :class="['episode', { 'episode--active': active }]"
    :data-test="`episode-card-${episode.number ?? 0}`"
    @click="selectable && emit('on-select')"
  >
    <div class="episode__thumb">
      <poster-image
        :src="episode.image"
        :alt="episode.name"
        ratio="still"
      />
    </div>

    <div class="episode__info">
      <p
        class="episode__eyebrow"
        v-text="code"
      />

      <h3
        class="episode__title"
        v-text="episode.name"
      />

      <p
        v-if="episode.summary"
        class="episode__desc"
        v-text="episode.summary"
      />
    </div>
  </component>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useLocale } from '@/locales'
import type { Episode } from '@/models'
import { joinMeta } from '@/utils/format'
import PosterImage from '@/components/ui/PosterImage.vue'

defineOptions({ name: 'EpisodeCard' })

const props = withDefaults(
  defineProps<{
    episode: Episode,
    active?: boolean,
    selectable?: boolean
  }>(),
  {
    active: false,
    selectable: true
  }
)

const emit = defineEmits<{
  'on-select': []
}>()

const { t } = useLocale()

const code = computed((): string => joinMeta([
  t('episode.code', { season: props.episode.season, number: props.episode.number ?? 1 }),
  props.episode.runtime === null ? null : t('episode.runtime', { minutes: props.episode.runtime })
]))
</script>

<style scoped>
.episode {
  display: flex;
  gap: 14px;
  width: 100%;
  padding: 0;
  text-align: left;
  background: none;
  border-radius: var(--r-card);
}

.episode--active {
  outline: 2px solid var(--ink);
  outline-offset: 6px;
}

.episode__thumb {
  flex: none;
  width: 116px;
}

.episode__info {
  display: flex;
  flex-direction: column;
  gap: var(--s-1);
  min-width: 0;
}

.episode__eyebrow {
  color: var(--ink-2);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.episode__title {
  font-size: 14px;
  font-weight: 600;
}

.episode__desc {
  overflow: hidden;
  display: -webkit-box;
  color: var(--ink-2);
  font-size: 12px;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

@media (min-width: 900px) {
  .episode {
    flex-direction: column;
    gap: var(--s-3);
  }

  .episode__thumb {
    width: 100%;
  }

  .episode__title {
    font-size: 15px;
  }
}
</style>
