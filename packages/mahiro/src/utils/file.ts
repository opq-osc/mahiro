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

const getFileBase64Prefix = (file: string) => {
  const isPng = /\.png$/.test(file)
  const isJpg = /\.jpe?g$/.test(file)
  const isGif = /\.gif$/.test(file)
  const isWebp = /\.webp$/.test(file)
  if (isPng) {
    return 'data:image/png;base64,'
  }
  if (isJpg) {
    return 'data:image/jpeg;base64,'
  }
  if (isGif) {
    return 'data:image/gif;base64,'
  }
  if (isWebp) {
    return 'data:image/webp;base64,'
  }
  throw new Error(`Unsupported file type, file: ${file}`)
}

export const getFileBase64 = async (file: string) => {
  try {
    const base64 = await readFile(file, 'base64')
    return `${getFileBase64Prefix(file)}${base64}`
  } catch {
    return
  }
}

export const getFileBase64Sync = (file: string) => {
  try {
    const base64 = readFileSync(file, 'base64')
    return `${getFileBase64Prefix(file)}${base64}`
  } catch {
    return
  }
}
