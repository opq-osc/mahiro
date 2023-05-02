import { consola } from 'consola'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { readFile } from 'fs/promises'
import { isBase64 } from './base64'

const logger = consola.withTag('file-utils') as typeof consola

export interface IDetectFileType {
  fileUrl?: string
  filePath?: string
  base64?: string
}

export const detectFileType = async (url: string): Promise<IDetectFileType> => {
  const isUrl = /^http/.test(url)
  if (isUrl) {
    return {
      fileUrl: url,
    }
  }
  const isDataFile = /^data:/.test(url)
  if (isDataFile) {
    const urlWithoutData = url.replace(/^data:.*?;base64,/, '')
    return {
      base64: urlWithoutData,
    }
  }
  // check is local file
  try {
    if (existsSync(url)) {
      return {
        filePath: url,
      }
    }
  } catch {}
  // check base64 url
  try {
    const isBase64Url = isBase64(url)
    if (isBase64Url) {
      logger.debug('is like base64 url')
      return {
        base64: url,
      }
    }
  } catch {
    logger.error(
      `Too long base64 string causes parsing failure, please write file and use file path send message`,
    )
  }
  return {}
}

export const getFileBase64 = async (file: string) => {
  try {
    const base64 = await readFile(file, 'base64')
    return base64
  } catch {
    return
  }
}

export const getFileBase64Sync = (file: string) => {
  try {
    const base64 = readFileSync(file, 'base64')
    return base64
  } catch {
    return
  }
}
