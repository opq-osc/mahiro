import { message } from 'antd'
import axios from 'axios'

const isDev = process.env.NODE_ENV === 'development'
const localBase = `http://localhost:8098/api/v1/panel`

export const request = axios.create({
  baseURL: isDev ? localBase : '/api/v1/panel',
  timeout: 10 * 1e3,
})

request.interceptors.response.use(
  (response) => {
    const path = response.config.url
    if (response.data?.code !== 200) {
      message.error(response.data?.message || `${path} error`)
    }
    return response?.data
  },
  (err) => {
    message.error(err?.message || 'Network Error')
    return Promise.reject(err)
  },
)

export type IResult =
  | {
      code?: number
    }
  | undefined
