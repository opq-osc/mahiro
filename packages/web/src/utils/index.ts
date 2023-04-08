import { isNumber, toNumber, toString, isNaN } from 'lodash'

export const isStringNumber = (str: string) => {
  if (isNumber(str) && !isNaN(str)) {
    return true
  }
  if (!str?.length) {
    return false
  }
  const num = toNumber(str)
  if (isNumber(num) && !isNaN(num) && toString(num) === str) {
    return true
  }
  return false
}

export const toNumberFromArray = (arr: string[]) => {
  return arr.map((item) => {
    return toNumber(item)
  })
}
