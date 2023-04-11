import { useVersion } from '@/stores/global'
import { useState } from 'react'

export const useRobotServerInfo = () => {
  const [info] = useVersion()

  const loginUrl = `${info?.robotUrl}/v1/login/getqrcode`
  const [loading, setLoading] = useState(false)

  const getLoginQrcode = async () => {
    try {
      setLoading(true)
      const res = await fetch(loginUrl)
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
