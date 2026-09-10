<template>
  <div
    class="show"
    data-test="show-view"
  >
    <div
      v-if="showStore.status === 'loading'"
      class="show__loading"
      data-test="show-skeleton"
    >
      <skeleton-block height="420px" />
    </div>

    <state-block
      v-else-if="showStore.status === 'error' || !showStore.detail"
      :title="t('state.error')"
      :hint="showStore.error ?? t('state.hint')"
      variant="error"
      test="show-error"
      retry
      @on-retry="load"
    />

    <template v-else>
      <show-hero
        :show="showStore.detail"
        :saved="saved"
        @on-save="listStore.toggle(showStore.detail)"
        @on-back="goBack"
        @on-share="share"
      />

      <section
        v-if="!desktop"
        class="show__synopsis"
        data-test="detail-synopsis"
      >
        <p
          v-if="showStore.detail.summary"
          class="show__synopsis-body"
          v-text="showStore.detail.summary"
        />

        <p
          v-if="starring"
          class="show__synopsis-cast"
        >
          {{ t('show.starring') }} {{ starring }}
        </p>
      </section>

      <show-tabs
        :model-value="showStore.tab"
        @update:model-value="showStore.setTab"
      />

      <section
        v-if="showStore.tab === 'episodes'"
        class="show__panel"
        data-test="detail-episodes"
      >
        <template v-if="showStore.seasons.length > 0">
          <season-select
            :model-value="showStore.season"
            :seasons="showStore.seasons"
            :count="showStore.episodes.length"
            @update:model-value="showStore.setSeason"
          />

          <ul class="show__episodes">
            <li
              v-for="episode in showStore.episodes"
              :key="episode.id"
            >
              <episode-card
                :episode="episode"
                :active="showStore.selected?.id === episode.id"
                @on-select="showStore.select(episode)"
              />
            </li>
          </ul>
        </template>

        <state-block
          v-else
          :title="t('episode.empty')"
          test="detail-episodes-empty"
        />
      </section>

      <section
        v-else-if="showStore.tab === 'details'"
        class="show__panel"
        data-test="detail-details"
      >
        <p
          class="show__summary"
          v-text="showStore.detail.summary"
        />

        <dl class="show__facts">
          <div
            v-for="fact in facts"
            :key="fact.label"
            data-test="detail-fact"
          >
            <dt
              data-test="detail-fact-label"
              v-text="fact.label"
            />

            <dd
              data-test="detail-fact-value"
              v-text="fact.value"
            />
          </div>
        </dl>
      </section>

      <section
        v-else-if="showStore.tab === 'cast'"
        class="show__panel"
        data-test="detail-cast"
      >
        <ul class="show__cast">
          <li
            v-for="member in showStore.detail.cast"
            :key="member.id"
            class="show__member"
          >
            <div class="show__member-photo">
              <poster-image
                :src="member.image"
                :alt="member.person"
              />
            </div>

            <p
              class="show__member-name"
              v-text="member.person"
            />

            <p
              class="show__member-role"
              v-text="member.character"
            />
          </li>
        </ul>
      </section>

      <section
        v-else
        class="show__panel"
        data-test="detail-similar"
      >
        <state-block
          v-if="similar.length === 0"
          :title="t('genre.empty')"
          test="detail-similar-empty"
        />

        <ul
          v-else
          class="show__similar"
        >
          <li
            v-for="item in similar"
            :key="item.id"
          >
            <show-card :show="item" />
          </li>
        </ul>
      </section>

      <episode-modal
        v-if="showStore.selected"
        :episode="showStore.selected"
        @on-close="showStore.select(null)"
      />
    </template>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { apiGet } from '@/utils/api'
import { useLocale } from '@/locales'
import { useShowStore } from '@/stores/show'
import { useListStore } from '@/stores/list'
import { watch, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ShowCard from '@/components/show/ShowCard.vue'
import ShowHero from '@/components/show/ShowHero.vue'
import ShowTabs from '@/components/show/ShowTabs.vue'
import StateBlock from '@/components/ui/StateBlock.vue'
import { useDesktop } from '@/composables/useMediaQuery'
import PosterImage from '@/components/ui/PosterImage.vue'
import EpisodeCard from '@/components/show/EpisodeCard.vue'
import SkeletonBlock from '@/components/ui/SkeletonBlock.vue'
import SeasonSelect from '@/components/show/SeasonSelect.vue'
import EpisodeModal from '@/components/show/EpisodeModal.vue'
import type { ShowFact, GenrePage, ShowSummary } from '@/models'

defineOptions({ name: 'ShowView' })

const { t } = useLocale()
const route = useRoute()
const router = useRouter()
const showStore = useShowStore()
const listStore = useListStore()
const similar = ref<ShowSummary[]>([])

const desktop = useDesktop()

const saved = computed((): boolean => (showStore.detail ? listStore.has(showStore.detail.id) : false))

const starring = computed((): string => {
  return (showStore.detail?.cast ?? []).slice(0, 3).map((member) => member.person).join(', ')
})

const facts = computed((): ShowFact[] => {
  const detail = showStore.detail

  if (!detail) {
    return []
  }

  const origin: ShowFact = detail.network
    ? { label: t('show.network'), value: detail.network }
    : { label: t('show.language'), value: detail.language ?? '—' }

  return [
    { label: t('show.premiered'), value: detail.premiered ?? '—' },
    { label: t('genre.name', 2), value: detail.genres.join(', ') || '—' },
    { label: t('show.status'), value: detail.status ?? '—' },
    origin
  ]
})

async function load(): Promise<void> {
  const id = Number(route.params.id)

  if (Number.isNaN(id)) {
    return
  }

  await showStore.open(id)
  await loadSimilar()
}

async function loadSimilar(): Promise<void> {
  const genre = showStore.detail?.genres[0]

  if (!genre) {
    similar.value = []
    return
  }

  try {
    const page = await apiGet<GenrePage>(`/genres/${genre.toLowerCase()}`, { limit: 12 })
    similar.value = page.shows.filter((item) => item.id !== showStore.detail?.id).slice(0, 6)
  } catch {
    similar.value = []
  }
}

function goBack(): void {
  if (window.history.state?.back) {
    router.back()
    return
  }

  router.push({ name: 'home' })
}

function share(): void {
  navigator.clipboard?.writeText(window.location.href)
}

onMounted(load)

watch(() => route.params.id, load)
</script>

<style scoped>
.show {
  display: flex;
  flex-direction: column;
  padding-bottom: var(--s-6);
}

.show__loading {
  padding: var(--gutter);
}

.show__synopsis {
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
  padding: 18px var(--gutter) 0;
}

.show__synopsis-body {
  color: var(--ink-2);
  font-size: 13px;
  line-height: 1.5;
}

.show__synopsis-cast {
  font-size: 12px;
}

.show__panel {
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
  padding: var(--s-4) var(--gutter) 0;
}

.show__episodes {
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
}

.show__facts dt {
  color: var(--ink-2);
  font-size: 11px;
  font-weight: 600;
}

.show__facts dd {
  margin: 0;
  font-size: 13px;
}

.show__summary {
  max-width: 720px;
  color: var(--ink-2);
  font-size: 14px;
  line-height: 1.6;
}

.show__facts {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--s-4);
  margin: 0;
}

.show__cast {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--s-4);
}

.show__member {
  display: flex;
  flex-direction: column;
  gap: var(--s-1);
}

.show__member-name {
  font-size: 13px;
  font-weight: 600;
}

.show__member-role {
  color: var(--ink-2);
  font-size: 11px;
}

.show__similar {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--s-4);
}

@media (min-width: 900px) {
  .show__panel {
    padding-top: 28px;
    gap: 22px;
  }

  .show__episodes {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
  }

  .show__cast,
  .show__similar {
    grid-template-columns: repeat(6, 1fr);
    gap: 20px;
  }

  .show__facts {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
