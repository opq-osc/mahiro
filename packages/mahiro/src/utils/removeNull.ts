import { isNil } from 'lodash'

export const removeNull = <T extends Record<string, any> = any>(obj?: T) => {
  if (!obj) {
    return obj
  }
  return Object.keys(obj).reduce((acc, key) => {
    if (!isNil(obj[key])) {
      // @ts-ignore
      acc[key] = obj[key]
    }
    return acc
  }, {}) as T
}
