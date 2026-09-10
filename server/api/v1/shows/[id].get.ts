import { getRouterParam } from 'nitro/h3'
import type { ShowDetail } from '@/models'
import { HTTPError, defineHandler } from 'nitro'
import { fetchShow, fetchImages } from '~/utils/tvmaze'
import { toDetail, pickBackdrop } from '~/utils/mappers'

export default defineHandler(async (event): Promise<ShowDetail> => {
  const id = getRouterParam(event, 'id')

  if (!id || !/^\d+$/.test(id)) {
    throw HTTPError.status(400, 'Bad Request', { message: 'Invalid show id' })
  }

  const showId = Number(id)
  const [show, images] = await Promise.all([fetchShow(showId), fetchImages(showId)])

  return { ...toDetail(show), backdrop: pickBackdrop(images) }
})
