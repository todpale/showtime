import viteConfig from './vite.config'
import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      testTimeout: 10000,
      hookTimeout: 30000,
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      coverage: {
        provider: 'v8',
        reporter: ['text', 'lcov', 'html'],
        include: ['src/**/*.{ts,vue}', 'server/**/*.ts'],
        exclude: ['node_modules/',
          'src/main.ts',
          'src/**/*.d.ts',
          'src/models/',
          '**/__tests__/**'
        ]
      }
    }
  })
)
