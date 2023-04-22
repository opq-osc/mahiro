import { existsSync } from 'fs'
import { readFile, stat, writeFile } from 'fs/promises'
import { IMahiroUse, ESendCmd, IUploadFile } from 'mahiro'
import { fileSync } from 'tmp-promise'
import { Transformer, compressJpeg } from '@napi-rs/image'

export interface IMahiroPng2JpgOptions {
  /**
   * auto transform png to jpg image size limit
   * @default 200 (unit: KB)
   */
  limit?: number
  /**
   * auto compress jpg size limit
   * @default 200 (unit: KB)
   */
  autoCompressLimit?: number
  /**
   * clear cache tmp file time
   * @default 10000 (unit: ms)
   */
  cacheClearTime?: number
}

export const DEFAULT_LIMIT = 200
export const DEFAULT_COMPRESS_LIMIT = 200
export const DEFAULT_CACHE_CLEAR_TIME = 10 * 1e3
const PNG_REG = /\.png$/i
const JPG_REG = /\.jpe?g$/i

// 😇
export const MahiroPng2Jpg = (opts: IMahiroPng2JpgOptions = {}) => {
  const {
    limit = DEFAULT_LIMIT,
    autoCompressLimit = DEFAULT_COMPRESS_LIMIT,
    cacheClearTime = DEFAULT_CACHE_CLEAR_TIME,
  } = opts
  const isNumber = typeof limit === 'number'
  if (!isNumber) {
    throw new Error('limit must be a number')
  }
  if (limit < 0) {
    throw new Error('limit must be greater than 0')
  }
  const use: IMahiroUse = (mahiro) => {
    const logger = mahiro.logger.withTag('png2jpg') as typeof mahiro.logger

    logger.info(
      `😇 You are using png2jpg plugin, limit: ${limit}kb, autoCompressLimit: ${autoCompressLimit}kb, cacheClearTime: ${cacheClearTime}ms`,
    )

    const transformImage = async (p: string): Promise<string> => {
      if (!existsSync(p)) {
        return p
      }
      // auto compress big jpg file
      const isJpg = JPG_REG.test(p)
      if (isJpg) {
        const size = (await stat(p)).size
        const kbSize = size / 1024
        if (kbSize <= autoCompressLimit) {
          return p
        }
        try {
          const jpg = await readFile(p)
          const output = await compressJpeg(jpg, { quality: 85 })
          await writeFile(p, output)
          logger.success(
            `jpg image is greater than compress limit (${kbSize}kb) , compress`,
            p,
          )
          return p
        } catch (e) {
          logger.error('compress jpg failed', e)
          return p
        }
      }
      // auto transform png to jpg
      const isPng = PNG_REG.test(p)
      if (!isPng) {
        return p
      }
      try {
        // check size, if > limit, transform png to jpg
        const size = (await stat(p)).size
        const kbSize = size / 1024
        logger.debug(`png image size: ${kbSize}kb`)
        if (kbSize <= limit) {
          return p
        }

        const png = await readFile(p)
        logger.debug('transform png to jpg', p)
        const output = await new Transformer(png).jpeg()
        const tmpFile = fileSync({ postfix: '.jpg' })
        await writeFile(tmpFile.name, output)
        logger.success(
          `png image is greater than limit (${kbSize}kb) , transform to jpg`,
          p,
        )

        // check jpg size, if > compress size, compress again
        const jpgSize = (await stat(tmpFile.name)).size
        const jpgKbSize = jpgSize / 1024
        if (jpgKbSize > autoCompressLimit) {
          logger.debug('still greater than compress limit, compress again', p)
          const jpg = await readFile(tmpFile.name)
          const output = await compressJpeg(jpg, { quality: 80 })
          // write
          await writeFile(tmpFile.name, output)
          logger.success(
            `png to jpg image is greater than compress limit (${jpgKbSize}kb) , compress again`,
            p,
          )
        }

        // 10s auto delete
        setTimeout(() => {
          logger.debug('auto delete tmp file', tmpFile.name)
          tmpFile.removeCallback()
        }, cacheClearTime)

        return tmpFile.name
      } catch (e) {
        logger.error('transform png to jpg failed', e)
        return p
      }
    }
    const getMime = async (str: string) => {
      try {
        const isBase64 = mahiro.utils.isBase64(str)
        if (isBase64) {
          const res = await mahiro.utils.fileType.fileTypeFromBuffer(Buffer.from(str, 'base64'))
          if (res?.mime) {
            return {
              isPng: res.mime === 'image/png',
              isJpg: res.mime === 'image/jpeg',
            }
          }
        }
      } catch {
        logger.warn('get mime failed')
      }
    }

    const accountRequests = [
      mahiro.mainAccount.request,
      ...mahiro.sideAccounts.map((i) => i.request),
    ]
    accountRequests.forEach((request) => {
      request.interceptors.request.use(async (config) => {
        const isPost = config.method?.toUpperCase() === 'POST'
        const isUploadUrl = config.url?.includes('/v1/upload')
        if (!isPost || !isUploadUrl) {
          return config
        }
        const params = config.data as IUploadFile | undefined
        const isUpload = params?.CgiCmd === ESendCmd.upload
        if (!isUpload) {
          return config
        }
        // file path
        const filePath = params?.CgiRequest?.FilePath
        if (filePath?.length) {
          const newFilePath = await transformImage(filePath)
          logger.debug(`New file path: ${newFilePath}`)
          params.CgiRequest.FilePath = newFilePath
          return config
        }
        // file url
        const fileUrl = params?.CgiRequest?.FileUrl
        if (fileUrl?.length) {
          const isPng = PNG_REG.test(fileUrl)
          if (isPng) {
            logger.info('You will send a png image from url, it may be big')
          }
          return config
        }
        // base64
        const base64 = params?.CgiRequest?.Base64Buf
        if (base64?.length) {
          const detected = await getMime(base64)
          const isPng = detected?.isPng
          const isJpg = detected?.isJpg
          if (isPng) {
            // if base64 is big, we will compress it
            const originFileSize = (base64.length / 4) * 3
            const kbSize = originFileSize / 1024
            logger.debug(`Will send png base64 image, size: ${kbSize}kb`)
            if (kbSize <= limit) {
              return config
            }
            const tmpFile = fileSync({ postfix: '.png' })
            await writeFile(tmpFile.name, base64, 'base64')
            const newFilePath = await transformImage(tmpFile.name)
            logger.debug(`New file path: ${newFilePath}`)
            const newBase64 = await readFile(newFilePath, 'base64')
            params.CgiRequest.Base64Buf = newBase64
            logger.success(
              `png base64 image is greater than limit (${kbSize}kb) , transform to jpg base64`,
            )

            // time out auto delete
            setTimeout(() => {
              logger.debug('auto delete tmp file', tmpFile.name)
              tmpFile.removeCallback()
            }, cacheClearTime)

            return config
          }
          if (isJpg) {
            // if base64 is big, we will compress it
            const originFileSize = (base64.length / 4) * 3
            const kbSize = originFileSize / 1024
            if (kbSize <= autoCompressLimit) {
              return config
            }
            const tmpFile = fileSync({ postfix: '.jpg' })
            await writeFile(tmpFile.name, base64, 'base64')
            const newFilePath = await transformImage(tmpFile.name)
            logger.debug(`New file path: ${newFilePath}`)
            const newBase64 = await readFile(newFilePath, 'base64')
            params.CgiRequest.Base64Buf = newBase64
            logger.success(
              `jpg base64 image is greater than compress limit (${kbSize}kb) , compress`,
            )

            // time out auto delete
            setTimeout(() => {
              logger.debug('auto delete tmp file', tmpFile.name)
              tmpFile.removeCallback()
            }, cacheClearTime)

            return config
          }
        }
        return config
      })
    })
  }

  return use
}
