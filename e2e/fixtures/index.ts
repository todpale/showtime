import { ApiMock, installApi } from './api'
import { expect, test as base } from '@playwright/test'

interface Fixtures {
  api: ApiMock
}

const test = base.extend<Fixtures>({
  api: [
    async ({ page }, use) => {
      const api = new ApiMock()

      await installApi(page, api)
      await use(api)

      expect(api.unmocked, 'every /api/v1 request must be mocked').toEqual([])
    },
    { auto: true }
  ]
})

export { test, expect }
