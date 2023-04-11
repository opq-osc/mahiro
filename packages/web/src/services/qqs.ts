import { request } from './base'

export const getQQsList = async () => {
  const res = await request.get('/qq/all')
  return (res?.data || []) as number[]
}
