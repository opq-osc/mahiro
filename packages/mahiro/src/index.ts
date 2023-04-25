// global effects
import { injectPolyfill } from './polyfill'
injectPolyfill()

// types
export * from './core/interface'
export * from './received/interface'
export * from './send/interface'

// api
export { Mahiro } from './core'
