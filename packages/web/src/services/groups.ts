import { IResult, request } from './base'

export interface IGroupList extends IGroup {}

export interface IGroup {
  id?: number
  name: string
  group_id: number
  admins: number[]
  plugins: number[]
  link_qqs: number[]
  expired_at: string
  distribute: boolean
}

export const getGroupsList = async () => {
  const res = await request.get('/groups')
  return (res?.data || []) as IGroupList[]
}

export const addGroup = async (params: IGroup) => {
  const res = await request.post(`/group/add`, params)
  return res as IResult
}

export const updateGroup = async (params: Partial<IGroup>) => {
  const res = await request.post(`/group/update`, params)
  return res as IResult
}

export const deleteGroup = async (id: number) => {
  const res = await request.post(`/group/delete`, { id })
  return res as IResult
}
