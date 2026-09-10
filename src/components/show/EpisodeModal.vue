<template>
  <div
    class="modal"
    data-test="episode-modal"
  >
    <button
      :aria-label="t('action.close')"
      class="modal__scrim"
      type="button"
      data-test="episode-modal-scrim-btn"
      @click="emit('on-close')"
    />

    <div
      class="modal__panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="episode-modal-title"
    >
      <div class="modal__head">
        <h2
          id="episode-modal-title"
          class="modal__title"
          data-test="episode-modal-title"
        >
          {{ episode.name }}
        </h2>

        <button
          ref="closeButton"
          :aria-label="t('action.close')"
          class="modal__close"
          type="button"
          data-test="episode-modal-close-btn"
          @click="emit('on-close')"
        >
          <app-icon
            :size="16"
            name="x"
          />
        </button>
      </div>

      <div class="modal__body">
        <div class="modal__picture">
          <poster-image
            :src="episode.image"
            :alt="episode.name"
            ratio="still"
          />
        </div>

        <div class="modal__meta">
          <p
            class="modal__eyebrow"
            data-test="episode-modal-code"
          >
            {{ code }}
          </p>

          <dl class="modal__facts">
            <div v-if="episode.airdate">
              <dt>{{ t('episode.air') }}</dt>

              <dd data-test="episode-modal-airdate">
                {{ episode.airdate }}
              </dd>
            </div>

            <div v-if="episode.rating !== null">
              <dt>{{ t('sort.byRating') }}</dt>

              <dd
                class="modal__rating"
                data-test="episode-modal-rating"
              >
                {{ ratingText(episode.rating) }}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <p
        v-if="episode.summary"
        class="modal__summary"
        data-test="episode-modal-summary"
      >
        {{ episode.summary }}
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useLocale } from '@/locales'
import type { Episode } from '@/models'
import AppIcon from '@/components/ui/AppIcon.vue'
import { joinMeta, ratingText } from '@/utils/format'
import PosterImage from '@/components/ui/PosterImage.vue'
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'

defineOptions({ name: 'EpisodeModal' })

const props = defineProps<{ episode: Episode }>()

const emit = defineEmits<{
  'on-close': []
}>()

const { t } = useLocale()

const closeButton = ref<HTMLButtonElement | null>(null)

const code = computed((): string => joinMeta([
  t('episode.code', { season: props.episode.season, number: props.episode.number ?? 1 }),
  props.episode.runtime === null ? null : t('episode.runtime', { minutes: props.episode.runtime })
]))

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    emit('on-close')
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)

  nextTick(() => {
    closeButton.value?.focus()
  })
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.modal {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: flex-end;
}

.modal__scrim {
  position: absolute;
  inset: 0;
  background: rgb(16 16 16 / 45%);
}

.modal__panel {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  padding: var(--s-5);
  background: var(--bg);
  border-radius: var(--s-4) var(--s-4) 0 0;
}

.modal__head {
  display: flex;
  gap: var(--s-3);
  align-items: flex-start;
  justify-content: space-between;
}

.modal__title {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 400;
  text-wrap: balance;
}

.modal__close {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: var(--ink-2);
  background: var(--surface);
  border-radius: var(--r-pill);
  transition: scale 0.15s ease;
}

.modal__close:active {
  scale: 0.96;
}

.modal__body {
  display: flex;
  gap: var(--s-4);
  align-items: flex-start;
}

.modal__picture {
  flex: none;
  width: 168px;
}

.modal__meta {
  display: flex;
  flex-direction: column;
  gap: var(--s-3);
  min-width: 0;
}

.modal__eyebrow {
  color: var(--ink-2);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.modal__facts {
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
}

.modal__facts dt {
  color: var(--ink-2);
  font-size: 11px;
}

.modal__facts dd {
  font-size: 13px;
  font-weight: 600;
}

.modal__rating {
  font-variant-numeric: tabular-nums;
}

.modal__summary {
  color: var(--ink-2);
  font-size: 13px;
  line-height: 1.55;
  text-wrap: pretty;
}

@media (min-width: 900px) {
  .modal {
    align-items: center;
    justify-content: center;
  }

  .modal__panel {
    max-width: 460px;
    border-radius: var(--s-3);
  }
}
</style>
