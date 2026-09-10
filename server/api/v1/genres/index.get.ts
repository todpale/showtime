import { defineHandler } from 'nitro'
import { readIndex } from '~/utils/genres'

export default defineHandler(async () => {
  const index = await readIndex()

  return index.genres
})
