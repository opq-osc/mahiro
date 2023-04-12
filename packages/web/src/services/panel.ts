import { request } from './base'

export interface IPanel {
  name: string
  content: string
  version?: string
}

export const getPanel = async () => {
  const res = await request('/panel')
  return (res?.data || []) as IPanel[]
}
