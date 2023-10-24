import * as fileType from 'mahiro/compiled/file-type'
import { isString } from 'lodash'
import consola from 'consola'
import download from 'download'

const logger = consola.withTag('utils/image') as typeof consola

export enum EImageType {
  jpg = 'jpg',
  png = 'png',
  gif = 'gif',
}

export const VALID_EXTS = [
  EImageType.jpg,
  EImageType.png,
  EImageType.gif,
] as const

export const getImageTypeByBase64 = async (base64: string) => {
  let base64WithoutPrefix = base64
  const hasPrefix = /^data:/.test(base64)
  if (hasPrefix) {
    base64WithoutPrefix = base64.replace(/^data:.*?;base64,/, '')
  }
  const buffer = Buffer.from(base64WithoutPrefix, 'base64')
  try {
    const type = await fileType.fileTypeFromBuffer(buffer)
    const ext = type?.ext as EImageType
    const isValidExt = VALID_EXTS.includes(ext)
    if (isValidExt) {
      return ext
    }
  } catch {
    logger.debug(`[getImageTypeByBase64] get image type failed`)
    return
  }
}

export const hasValidImageExt = (str: string) => {
  if (!str?.length || !isString(str)) {
    return false
  }
  const hasValidExtSuffix = VALID_EXTS.some((ext) => {
    return str.endsWith(`.${ext}`)
  })
  return hasValidExtSuffix
}

export const detectUrlImageType = async (url: string) => {
  const hasDirectImageExt = hasValidImageExt(url)
  if (hasDirectImageExt) {
    const ext = url.split('.').pop() as EImageType
    return ext
  } else {
    // try download
    try {
      const buffer = await download(url, { timeout: 10 * 1e3 })
      const imageType = await fileType.fileTypeFromBuffer(buffer)
      const ext = imageType?.ext as EImageType
      if (ext) {
        const isValidExt = VALID_EXTS.includes(ext)
        if (isValidExt) {
          return ext
        }
      }
    } catch {}
  }
}
