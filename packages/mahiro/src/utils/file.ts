import { existsSync, readFileSync } from 'fs'
import { readFile } from 'fs/promises'

export interface IDetectFileType {
  fileUrl?: string
  filePath?: string
}

export const detectFileType = (url: string): IDetectFileType => {
  const isUrl = /^http/.test(url)
  if (isUrl) {
    return {
      fileUrl: url,
    }
  }
  const isDataFile = /^data:/.test(url)
  if (isDataFile) {
    return {
      fileUrl: url,
    }
  }
  try {
    // check local file
    if (existsSync(url)) {
      return {
        filePath: url,
      }
    }
  } catch {
    return {}
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
