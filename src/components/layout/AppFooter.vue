<template>
  <footer
    class="footer"
    data-test="app-footer"
  >
    <router-link
      :to="{ name: 'home' }"
      class="footer__wordmark"
    >
      {{ t('app.name') }}
    </router-link>

    <nav
      :aria-label="t('footer.name')"
      class="footer__links"
    >
      <router-link
        :to="{ name: 'genres' }"
        class="footer__link"
      >
        {{ t('nav.genre') }}
      </router-link>

      <router-link
        :to="{ name: 'list' }"
        class="footer__link"
      >
        {{ t('nav.myList') }}
      </router-link>
    </nav>
  </footer>
</template>

<script lang="ts" setup>
import { useLocale } from '@/locales'
import { RouterLink } from 'vue-router'

defineOptions({ name: 'AppFooter' })

const { t } = useLocale()
</script>

<style scoped>
.footer {
  display: flex;
  gap: var(--s-5);
  align-items: center;
  justify-content: space-between;
  height: 112px;
  margin-top: var(--s-6);
  padding: 0 var(--gutter);
  background: var(--surface);
}

.footer__wordmark {
  font-family: var(--font-display);
  font-size: 26px;
}

.footer__links {
  display: flex;
  flex-wrap: wrap;
  gap: 26px;
  align-items: center;
}

.footer__link {
  color: var(--ink-2);
  font-size: 12px;
}
</style>
