import { consola } from 'consola'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { readFile } from 'fs/promises'
import isBase64 from 'is-base64'
import { type MimeType, fileTypeFromBuffer } from 'mahiro/compiled/file-type'

const logger = consola.withTag('file-utils') as typeof consola

export interface IDetectFileType {
  fileUrl?: string
  filePath?: string
  base64?: string
}

const ALLOW_MIME_TYPES: MimeType[] = [
  // image
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]

export const detectFileType = async (url: string): Promise<IDetectFileType> => {
  const isUrl = /^http/.test(url)
  if (isUrl) {
    return {
      fileUrl: url,
    }
  }
  const isDataFile = /^data:/.test(url)
  if (isDataFile) {
    return {
      base64: url,
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
  const isBase64Url = isBase64(url)
  // we auto transform to base64 with data prefix
  if (isBase64Url) {
    logger.info(
      `Use base64 to send image, but without 'data:' prefix, we will try auto transform it.`,
    )
    try {
      // https://gist.github.com/tuananh/63aa569531839c920e9cfe472eb17e35
      const res = await fileTypeFromBuffer(Buffer.from(url, 'base64'))
      const mime = res?.mime
      if (mime?.length) {
        const isLegalMime = ALLOW_MIME_TYPES.includes(mime)
        if (!isLegalMime) {
          logger.error(`Not allow mime type: ${mime}!`)
          return {}
        }
        const base64WithDataPrefix = `data:${mime};base64,${url}`
        logger.success(
          `Auto transform base64 to data url success!, mime: ${mime}`,
        )
        return {
          base64: base64WithDataPrefix,
        }
      } else {
        logger.error(`Detect file mime type failed`)
      }
    } catch (_) {
      logger.error(`Auto transform base64 to data url failed`)
    }
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
