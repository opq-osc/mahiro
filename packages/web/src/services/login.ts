import { request } from './base'

export interface IQrcodeReq {
  query: string
}

export interface ILoginReq {
  qq?: number
  devicename?: string
}

export const getQrcode = async (params: IQrcodeReq) => {
  const res = await request.post('/login/getqrcode', params)
  return res?.data as string
}
