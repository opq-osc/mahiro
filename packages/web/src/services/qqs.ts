import { request } from './base'

export interface IAccount {
  url: string
  qq: number
  side: boolean
  local: boolean
  external: boolean
}

export const getQQsList = async () => {
  const res = await request.get('/accounts')
  return (res?.data || []) as IAccount[]
}
