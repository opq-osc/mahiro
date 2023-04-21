declare global {
  interface Window {
    __mahiro_request__: import('axios').AxiosInstance
  }
}

export {}
