<template>
  <section
    class="hero"
    data-test="detail-hero"
  >
    <img
      v-if="art"
      :src="art"
      :alt="show.name"
      class="hero__art"
    >

    <div class="hero__scrim" />

    <div class="hero__top">
      <button
        :aria-label="t('action.back')"
        class="hero__circle"
        type="button"
        data-test="detail-back-btn"
        @click="emit('on-back')"
      >
        <app-icon
          :size="18"
          name="arrowLeft"
        />
      </button>

      <div class="hero__top-actions">
        <button
          :aria-label="t('action.share')"
          class="hero__circle"
          type="button"
          data-test="detail-share-btn"
          @click="share"
        >
          <app-icon
            :size="18"
            name="share"
          />
        </button>
      </div>
    </div>

    <div class="hero__body">
      <div
        v-if="desktop"
        class="hero__poster"
      >
        <poster-image
          :src="show.posterLarge"
          :alt="show.name"
        />
      </div>

      <div class="hero__info">
        <p
          v-if="eyebrow"
          class="hero__eyebrow"
          v-text="eyebrow"
        />

        <h1
          class="hero__title u-display"
          data-test="detail-title"
        >
          {{ show.name }}
        </h1>

        <div class="hero__meta">
          <rating-pill
            :rating="show.rating"
            size="lg"
          />

          <span
            class="hero__meta-line"
            data-test="detail-meta"
            v-text="meta"
          />
        </div>

        <p
          v-if="show.summary"
          class="hero__summary"
          data-test="detail-summary"
          v-text="show.summary"
        />

        <dl
          v-if="starring || show.creators.length > 0"
          class="hero__credits"
        >
          <template v-if="starring">
            <dt>{{ t('show.starring') }}</dt>

            <dd data-test="detail-starring">
              {{ starring }}
            </dd>
          </template>

          <template v-if="show.creators.length > 0">
            <dt>{{ t('show.creator', show.creators.length) }}</dt>

            <dd data-test="detail-creators">
              {{ show.creators.join(', ') }}
            </dd>
          </template>
        </dl>

        <div class="hero__cta">
          <button
            :aria-pressed="saved"
            :class="['hero__list', { 'hero__list--active': saved }]"
            type="button"
            data-test="detail-add-btn"
            @click="emit('on-save')"
          >
            <app-icon
              :size="16"
              name="plus"
            />

            <span v-text="saved ? t('action.inList') : t('action.add')" />
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useLocale } from '@/locales'
import { joinMeta } from '@/utils/format'
import type { ShowDetail } from '@/models'
import AppIcon from '@/components/ui/AppIcon.vue'
import RatingPill from '@/components/ui/RatingPill.vue'
import { useDesktop } from '@/composables/useMediaQuery'
import PosterImage from '@/components/ui/PosterImage.vue'

defineOptions({ name: 'ShowHero' })

const props = defineProps<{ saved: boolean, show: ShowDetail }>()
const emit = defineEmits<{
  'on-save': [],
  'on-back': [],
  'on-share': []
}>()

const { t } = useLocale()
const desktop = useDesktop()

const art = computed((): string | null => props.show.backdrop ?? props.show.posterLarge)

const eyebrow = computed((): string => (props.show.network
  ? t('show.original', { network: props.show.network })
  : ''))

const starring = computed((): string => props.show.cast.slice(0, 3).map((member) => member.person).join(', '))

const meta = computed((): string => joinMeta([
  props.show.year === null ? null : String(props.show.year),
  props.show.seasonCount > 0 ? t('show.seasonCount', { count: props.show.seasonCount }, props.show.seasonCount) : null,
  props.show.episodeCount > 0 ? t('episode.count', { count: props.show.episodeCount }, props.show.episodeCount) : null,
  props.show.status,
  props.show.genres.join(', ')
]))

async function share(): Promise<void> {
  const payload: ShareData = {
    title: props.show.name,
    url: window.location.href,
    ...(props.show.summary ? { text: props.show.summary } : {})
  }

  if (typeof navigator.share !== 'function') {
    emit('on-share')

    return
  }

  try {
    await navigator.share(payload)
  } catch (cause) {
    if (cause instanceof Error && cause.name === 'AbortError') {
      return
    }

    emit('on-share')
  }
}
</script>

<style scoped>
.hero {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 450px;
  padding: var(--s-4) var(--gutter) 22px;
  background: var(--dark);
}

.hero__art {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero__scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgb(0 0 0 / 10%) 0%, rgb(0 0 0 / 45%) 45%, rgb(0 0 0 / 94%) 100%);
}

.hero__top,
.hero__body {
  position: relative;
}

.hero__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.hero__top-actions {
  display: flex;
  gap: 10px;
}

.hero__circle {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  color: var(--ink-inv);
  background: rgb(255 255 255 / 16%);
  border-radius: var(--r-pill);
}

.hero__body {
  display: flex;
  gap: 52px;
  align-items: flex-end;
  margin-top: var(--s-6);
}

.hero__poster {
  flex: none;
  width: 280px;
}

.hero__info {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  color: var(--ink-inv);
}

.hero__eyebrow {
  color: rgb(255 255 255 / 72%);
  text-transform: uppercase;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.18em;
}

.hero__title {
  font-size: 52px;
  line-height: 1;
}

.hero__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.hero__meta-line {
  color: rgb(255 255 255 / 85%);
  font-size: 12px;
}

.hero__summary {
  display: none;
  max-width: 640px;
  color: rgb(255 255 255 / 78%);
  font-size: 15px;
  line-height: 1.6;
}

.hero__credits {
  display: none;
  grid-template-columns: auto 1fr;
  gap: var(--s-1) var(--s-2);
  font-size: 12px;
}

.hero__credits dt {
  color: rgb(255 255 255 / 56%);
  font-weight: 600;
}

.hero__credits dd {
  margin: 0;
  color: rgb(255 255 255 / 85%);
}

.hero__cta {
  display: flex;
  gap: var(--s-3);
  align-items: center;
  margin-top: var(--s-2);
}

.hero__list {
  display: inline-flex;
  gap: 9px;
  align-items: center;
  height: 48px;
  padding: 0 26px;
  color: var(--ink-inv);
  border: 1px solid rgb(255 255 255 / 42%);
  border-radius: var(--r-pill);
  font-size: 14px;
  font-weight: 600;
}

.hero__list--active {
  color: var(--ink);
  background: var(--accent);
  border-color: var(--accent);
}

@media (min-width: 900px) {
  .hero {
    min-height: 520px;
    padding: var(--s-5) var(--gutter) 56px;
  }

  .hero__scrim {
    background: linear-gradient(90deg, rgb(16 16 16 / 92%) 30%, rgb(16 16 16 / 60%) 100%);
  }

  .hero__title {
    font-size: 84px;
    line-height: 0.98;
  }

  .hero__meta-line {
    font-size: 13px;
  }

  .hero__summary,
  .hero__credits {
    display: grid;
  }

  .hero__summary {
    display: block;
  }
}
</style>
