<template>
  <nav
    :aria-label="t('nav.name')"
    class="nav"
    data-test="bottom-nav"
  >
    <router-link
      v-for="item in items"
      :key="item.name"
      :to="{ name: item.name }"
      :data-test="`bottom-nav-${item.test}`"
      class="nav__item"
      active-class="nav__item--active"
    >
      <app-icon
        :size="20"
        :name="item.icon"
      />

      <span
        class="nav__label"
        v-text="item.label"
      />
    </router-link>
  </nav>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useLocale } from '@/locales'
import { RouterLink } from 'vue-router'
import type { NavItem } from '@/models'
import AppIcon from '@/components/ui/AppIcon.vue'

defineOptions({ name: 'BottomNav' })

const { t } = useLocale()

const items = computed((): NavItem[] => [
  { name: 'home', test: 'home', icon: 'house', label: t('nav.home') },
  { name: 'search', test: 'search', icon: 'search', label: t('nav.search') },
  { name: 'list', test: 'list', icon: 'bookmark', label: t('nav.list') }
])
</script>

<style scoped>
.nav {
  position: sticky;
  bottom: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--nav-h);
  padding: 0 var(--s-6);
  background: var(--bg);
  border-top: 1px solid var(--line);
}

.nav__item {
  display: flex;
  flex-direction: column;
  gap: var(--s-1);
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  color: var(--ink-2);
}

.nav__item--active {
  color: var(--ink);
}

.nav__label {
  font-size: 10px;
  font-weight: 600;
}
</style>
