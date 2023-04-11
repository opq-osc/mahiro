import type { Mahiro } from "../core"

export interface IDatabaseOpts {
  path: string
  mahiro: Mahiro
}

export interface IDataRegisterPluginOpts {
  name: string
  internal?: boolean
}

export interface IDataPlugin {
  name: string
  enabled: boolean
  white_list_users: string
  black_list_users: string
  internal: boolean
  threshold?: number
}

export interface IMvcPlugin {
  id: number
  name: string
  enabled: boolean
  white_list_users: number[]
  black_list_users: number[]
  internal: boolean
  threshold: number
}

export interface IDataGroup {
  name: string
  group_id: number
  admins: string
  expired_at: string
  plugins: string
  link_qqs: string
}

export interface IMvcGroup {
  id: number
  name: string
  group_id: number
  admins: number[]
  expired_at: string
  plugins: number[]
  link_qqs: number[]
}

export type IDataCache<T> = Map<number, T>

export const getCacheTime = () => {
  if (process.env.MAHIRO_DATABASE_CACHE_TIME) {
    return Number(process.env.MAHIRO_DATABASE_CACHE_TIME)
  }
  return 5 * 1e3
}

export enum EVersion {
  v1 = 'v1',
}

const DATABASE_API_PREFIX = `/api/v1/panel`
export const DATABASE_APIS = {
  getPlugins: `${DATABASE_API_PREFIX}/plugins`,
  updatePlugin: `${DATABASE_API_PREFIX}/plugin/update`,
  getGroups: `${DATABASE_API_PREFIX}/groups`,
  updateGroup: `${DATABASE_API_PREFIX}/group/update`,
  addGroup: `${DATABASE_API_PREFIX}/group/add`,
  deleteGroup: `${DATABASE_API_PREFIX}/group/delete`,
  registerPlugin: `${DATABASE_API_PREFIX}/plugin/register`,
  getVersion: `${DATABASE_API_PREFIX}/version`,
  getAllQQs: `${DATABASE_API_PREFIX}/qq/all`,
} as const
