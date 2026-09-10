<template>
  <div
    class="list"
    data-test="list-view"
  >
    <h1
      class="list__title u-display"
      v-text="t('list.name')"
    />

    <state-block
      v-if="store.count === 0"
      :title="t('list.empty')"
      :hint="t('list.hint')"
      test="list-empty"
    />

    <ul
      v-else
      class="list__grid"
      data-test="list-grid"
    >
      <li
        v-for="show in store.shows"
        :key="show.id"
      >
        <show-card :show="show" />
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { useLocale } from '@/locales'
import { useListStore } from '@/stores/list'
import ShowCard from '@/components/show/ShowCard.vue'
import StateBlock from '@/components/ui/StateBlock.vue'

defineOptions({ name: 'ListView' })

const { t } = useLocale()
const store = useListStore()
</script>

<style scoped>
.list {
  display: flex;
  flex-direction: column;
  gap: var(--s-5);
  padding: var(--s-5) var(--gutter) var(--s-6);
}

.list__title {
  font-size: 48px;
  line-height: 1.02;
}

.list__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--s-4);
}

@media (min-width: 900px) {
  .list__grid {
    grid-template-columns: repeat(6, 1fr);
    gap: 20px;
  }
}
</style>
