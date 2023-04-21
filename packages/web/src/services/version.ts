import { request } from './base'

export interface IVersionInfo {
  version: string
}

export const getVersion = async () => {
  const res = await request.get(`/version`)
  return res?.data as IVersionInfo
}
