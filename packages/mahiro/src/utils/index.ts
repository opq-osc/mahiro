import { consola } from 'consola'

const logger = consola.withTag('utils') as typeof consola

export const toArrayNumber = (strArr: string) => {
  const arr = strArr.split(',')
  return arr.filter(Boolean).map((i) => Number(i))
}

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const tryParse = <T = undefined>(str: string) => {
  try {
    return JSON.parse(str) as T
  } catch {
    logger.error('tryParse error', str)
    return
  }
}
