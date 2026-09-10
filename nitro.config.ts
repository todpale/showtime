import { defineConfig } from 'nitro'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  serverDir: './server',
  alias: {
    '~': fileURLToPath(new URL('./server', import.meta.url))
  },
  ignore: [
    '**/__tests__/**',
    '**/*.spec.ts',
    '**/*.test.ts'
  ],
  storage: {
    genres: { driver: 'fsLite', base: './.data/genres' }
  }
})
