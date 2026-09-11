<template>
  <header
    class="header"
    data-test="app-header"
  >
    <template v-if="desktop">
      <nav
        :aria-label="t('nav.name')"
        class="header__nav"
      >
        <router-link
          v-for="link in links"
          :key="link.name"
          :to="{ name: link.name }"
          :data-test="`header-nav-${link.name}`"
          class="header__link"
          active-class="header__link--active"
        >
          {{ link.label }}
        </router-link>
      </nav>

      <router-link
        :to="{ name: 'home' }"
        class="header__wordmark"
        data-test="header-wordmark"
      >
        {{ t('app.name') }}
      </router-link>

      <div class="header__tools">
        <form
          class="header__search"
          role="search"
          @submit.prevent="handleSubmit"
        >
          <app-icon
            :size="16"
            name="search"
          />

          <input
            v-model="term"
            :placeholder="t('search.placeholder')"
            :aria-label="t('search.placeholder')"
            class="header__input"
            type="search"
            data-test="header-search-input"
          >
        </form>

        <button
          :aria-label="t('filter.open')"
          class="header__filter"
          type="button"
          data-test="header-filter-btn"
          @click="emits('filters')"
        >
          <app-icon
            :size="17"
            name="slidersHorizontal"
          />
        </button>
      </div>
    </template>

    <template v-else>
      <router-link
        :to="{ name: 'list' }"
        :aria-label="t('nav.myList')"
        class="header__icon-btn"
        data-test="header-list-btn"
      >
        <app-icon
          :size="22"
          name="bookmark"
        />
      </router-link>

      <router-link
        :to="{ name: 'home' }"
        class="header__wordmark"
        data-test="header-wordmark"
      >
        {{ t('app.name') }}
      </router-link>
    </template>
  </header>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useLocale } from '@/locales'
import type { NavLink } from '@/models'
import AppIcon from '@/components/ui/AppIcon.vue'
import { useRouter, RouterLink } from 'vue-router'
import { useDesktop } from '@/composables/useMediaQuery'

defineOptions({ name: 'AppHeader' })

const emits = defineEmits<{ filters: [] }>()

const { t } = useLocale()
const router = useRouter()
const desktop = useDesktop()
const term = ref<string>('')

const links = computed((): NavLink[] => [
  { name: 'home', label: t('nav.home') },
  { name: 'genres', label: t('nav.genre') },
  { name: 'list', label: t('nav.myList') }
])

function handleSubmit(): void {
  const query = term.value.trim()

  if (!query) {
    return
  }

  router.push({ name: 'search', query: { q: query } })
}
</script>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  gap: var(--s-4);
  align-items: center;
  justify-content: space-between;
  height: var(--header-h);
  padding: 0 var(--gutter);
  background: var(--bg);
}

.header__wordmark {
  font-family: var(--font-display);
  font-size: 28px;
  letter-spacing: -0.01em;
}

.header__icon-btn,
.header__avatar {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  color: var(--ink);
}

@media (min-width: 900px) {
  .header {
    border-bottom: 1px solid var(--line);
  }

  .header__wordmark {
    font-size: 32px;
  }

  .header__nav,
  .header__tools {
    display: flex;
    flex: 1;
    gap: 30px;
    align-items: center;
  }

  .header__tools {
    gap: 14px;
    justify-content: flex-end;
  }

  .header__link {
    color: var(--ink-2);
    font-size: 14px;
  }

  .header__link--active {
    color: var(--ink);
    font-weight: 600;
  }

  .header__search {
    display: flex;
    gap: 9px;
    align-items: center;
    width: 300px;
    height: 42px;
    padding: 0 var(--s-4);
    color: var(--ink-2);
    background: var(--surface);
    border-radius: var(--r-pill);
  }

  .header__input {
    width: 100%;
    background: none;
    border: 0;
    font-size: 13px;
  }

  .header__input:focus {
    outline: none;
  }

  .header__filter {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    color: var(--ink-inv);
    background: var(--ink);
    border-radius: var(--r-pill);
  }
}
</style>
