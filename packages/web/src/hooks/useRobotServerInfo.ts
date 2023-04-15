import { useVersion } from '@/stores/global'
import { useState } from 'react'
import qs from 'qs'

export interface ILoginReq {
  json?: 1
  devicename?: string
  qq?: number
}

export const useRobotServerInfo = () => {
  const [info] = useVersion()

  const loginUrl = `${info?.robotUrl}/v1/login/getqrcode`
  const [loading, setLoading] = useState(false)

  const getLoginQrcode = async (params: ILoginReq = {}) => {
    const query = qs.stringify(params)
    try {
      setLoading(true)
      const res = await fetch(`${loginUrl}${query?.length ? `?${query}` : ''}`)
      const text = await res.text()
      const match = text.match(/<img (?:.+?)src="(.+?)"(?:.+)\/>/)
      const src = match?.[1]
      return src
    } finally {
      setLoading(false)
    }
  }

  return {
    getLoginQrcode,
    loading,
  }
}
