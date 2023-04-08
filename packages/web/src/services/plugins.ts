import { IResult, request } from './base'

export type IPluginsList = IPlugin[]

export interface IPlugin {
  id: number
  name: string
  enabled: boolean
  internal: boolean
  threshold: number
  white_list_users: number[]
  black_list_users: number[]
}

export const getPluginsList = async () => {
  const response = await request.get('/plugins')
  return (response?.data || []) as IPluginsList
}

export const updatePlugin = async (params: Partial<IPlugin>) => {
  const res = await request.post('/plugin/update', params)
  return res as IResult
}
