<template>
  <section
    class="spotlight"
    data-test="spotlight"
  >
    <img
      v-if="art"
      :src="art"
      :alt="show.name"
      class="spotlight__art"
    >

    <div class="spotlight__scrim" />

    <div class="spotlight__content">
      <p
        class="spotlight__eyebrow"
        v-text="eyebrow"
      />

      <h1
        class="spotlight__title u-display"
        v-text="show.name"
      />

      <div class="spotlight__meta">
        <rating-pill
          :rating="show.rating"
          size="lg"
        />

        <span
          class="spotlight__meta-line"
          v-text="meta"
        />
      </div>

      <div class="spotlight__cta">
        <router-link
          :to="{ name: 'show', params: { id: show.id } }"
          class="spotlight__watch"
          data-test="spotlight-watch-btn"
        >
          <app-icon
            :size="16"
            name="play"
            filled
          />

          <span v-text="t('action.watch')" />
        </router-link>

        <button
          :class="['spotlight__list', { 'spotlight__list--active': isSaved }]"
          type="button"
          data-test="spotlight-list-btn"
          @click="store.toggle(show)"
        >
          <app-icon
            :size="16"
            name="plus"
          />

          <span v-text="isSaved ? t('action.inList') : t('action.add')" />
        </button>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useLocale } from '@/locales'
import { RouterLink } from 'vue-router'
import { joinMeta } from '@/utils/format'
import type { ShowSummary } from '@/models'
import { useListStore } from '@/stores/list'
import AppIcon from '@/components/ui/AppIcon.vue'
import RatingPill from '@/components/ui/RatingPill.vue'

defineOptions({ name: 'SpotlightBanner' })

const props = defineProps<{ show: ShowSummary }>()

const { t } = useLocale()
const store = useListStore()

const art = computed((): string | null => props.show.backdrop ?? props.show.posterLarge)
const isSaved = computed((): boolean => store.has(props.show.id))

const eyebrow = computed((): string => {
  return props.show.network
    ? t('show.original', { network: props.show.network })
    : t('home.featured')
})

const meta = computed((): string => joinMeta([
  props.show.year === null ? null : String(props.show.year),
  props.show.type,
  props.show.genres.join(', ')
]))
</script>

<style scoped>
.spotlight {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
  height: 420px;
  background: var(--dark);
}

.spotlight__art {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.spotlight__scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgb(0 0 0 / 0%) 0%, rgb(0 0 0 / 72%) 55%, rgb(0 0 0 / 95%) 100%);
}

.spotlight__content {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: flex-start;
  max-width: 600px;
  padding: 0 var(--gutter) 52px;
  color: var(--ink-inv);
}

.spotlight__eyebrow {
  color: rgb(255 255 255 / 76%);
  text-transform: uppercase;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.16em;
}

.spotlight__title {
  font-size: 76px;
  line-height: 1;
}

.spotlight__meta {
  display: flex;
  gap: var(--s-3);
  align-items: center;
}

.spotlight__meta-line {
  color: rgb(255 255 255 / 85%);
  font-size: 13px;
}

.spotlight__cta {
  display: flex;
  gap: var(--s-3);
  align-items: center;
  margin-top: var(--s-2);
}

.spotlight__watch,
.spotlight__list {
  display: inline-flex;
  gap: 9px;
  align-items: center;
  height: 48px;
  padding: 0 26px;
  border-radius: var(--r-pill);
  font-size: 14px;
  font-weight: 600;
}

.spotlight__watch {
  color: var(--ink);
  background: var(--ink-inv);
}

.spotlight__list {
  color: var(--ink-inv);
  border: 1px solid rgb(255 255 255 / 42%);
}

.spotlight__list--active {
  color: var(--ink);
  background: var(--accent);
  border-color: var(--accent);
}
</style>
