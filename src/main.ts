import App from './App.vue'
import router from './router'
import { createApp } from 'vue'
import { i18n } from '@/locales'
import { createPinia } from 'pinia'
import '@/assets/styles/vars.css'
import '@/assets/styles/base.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)

app.mount('#app')
