import { existsSync, unlinkSync } from 'fs'
import { readFile, stat, writeFile } from 'fs/promises'
import { IMahiroUse, ESendCmd, IUploadFile } from 'mahiro'
import { fileSync } from 'tmp-promise'
import { Transformer, compressJpeg } from '@napi-rs/image'
import { compressGIF } from './compressGIF'

export interface IMahiroPng2JpgOptions {
  /**
   * auto transform png to jpg image size limit
   * @default 200 (unit: KB)
   * @description set `false` to disable
   * @oldname limit 1.0.0
   */
  pngLimit?: number | false
  /**
   * auto compress jpg size limit
   * @default 200 (unit: KB)
   * @description set `false` to disable
   * @oldname autoCompressLimit 1.0.0
   */
  jpgLimit?: number | false
  /**
   * auto compress gif size limit
   * @default 200 (unit: KB)
   * @description set `false` to disable
   * @version 2.0.0
   */
  gifLimit?: number | false
  /**
   * clear cache tmp file time
   * @default 10000 (unit: ms)
   */
  cacheClearTime?: number
}

export const DEFAULT_CONFIGS: Required<IMahiroPng2JpgOptions> = {
  pngLimit: 200,
  jpgLimit: 200,
  gifLimit: 200,
  cacheClearTime: 10 * 1e3,
}
const PNG_REG = /\.png$/i
const JPG_REG = /\.jpe?g$/i
const GIF_REG = /\.gif$/i

export const MahiroPng2Jpg = (opts: IMahiroPng2JpgOptions = {}) => {
  let {
    pngLimit,
    jpgLimit,
    gifLimit,
    cacheClearTime = DEFAULT_CONFIGS.cacheClearTime,
  } = opts

  const enablePng = pngLimit !== false
  if (enablePng) {
    pngLimit ||= DEFAULT_CONFIGS.pngLimit
  }
  const enableJpg = jpgLimit !== false
  if (enableJpg) {
    jpgLimit ||= DEFAULT_CONFIGS.jpgLimit
  }
  const enableGif = gifLimit !== false
  if (enableGif) {
    gifLimit ||= DEFAULT_CONFIGS.gifLimit
  }

  const use: IMahiroUse = (mahiro) => {
    const logger = mahiro.logger.withTag('png2jpg') as typeof mahiro.logger

    logger.info(
      `enable png2jpg, pngLimit: ${
        enablePng ? pngLimit : 'disabled'
      }, jpgLimit: ${enableJpg ? jpgLimit : 'disabled'}, gifLimit: ${
        enableGif ? gifLimit : 'disabled'
      }`,
    )
    const isAllDisabled = !enablePng && !enableJpg && !enableGif
    if (isAllDisabled) {
      logger.warn('all disabled, skip png2jpg')
      return
    }

    const transformImage = async (p: string): Promise<string> => {
      if (!existsSync(p)) {
        return p
      }
      // auto compress big jpg file
      const isJpg = JPG_REG.test(p)
      if (enablePng && isJpg) {
        const size = (await stat(p)).size
        const kbSize = size / 1024
        if (kbSize <= (jpgLimit as number)) {
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
      if (enablePng && isPng) {
        try {
          // check size, if > limit, transform png to jpg
          const size = (await stat(p)).size
          const kbSize = size / 1024
          logger.debug(`png image size: ${kbSize}kb`)
          if (kbSize <= (pngLimit as number)) {
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

          if (enableJpg) {
            // check jpg size, if > compress size, compress again
            const jpgSize = (await stat(tmpFile.name)).size
            const jpgKbSize = jpgSize / 1024
            if (jpgKbSize > (jpgLimit as number)) {
              logger.debug(
                'still greater than compress limit, compress again',
                p,
              )
              const jpg = await readFile(tmpFile.name)
              const output = await compressJpeg(jpg, { quality: 80 })
              // write
              await writeFile(tmpFile.name, output)
              logger.success(
                `png to jpg image is greater than compress limit (${jpgKbSize}kb) , compress again`,
                p,
              )
            }
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
      // auto compress git
      const isGif = GIF_REG.test(p)
      if (enableGif && isGif) {
        const size = (await stat(p)).size
        const kbSize = size / 1024
        if (kbSize <= (gifLimit as number)) {
          return p
        }
        try {
          const newFile = await compressGIF(p)
          if (newFile?.length && existsSync(newFile)) {
            logger.success(
              `gif image is greater than compress limit (${kbSize}kb) , compress`,
              p,
            )

            // clear cache file
            setTimeout(() => {
              logger.debug('auto delete tmp file', newFile)
              if (existsSync(newFile)) {
                unlinkSync(newFile)
              }
            }, cacheClearTime)

            return newFile
          }
          throw new Error('compress gif failed')
        } catch (e) {
          logger.error('compress gif failed', e)
          return p
        }
      }
      logger.debug('not png or jpg or gif, skip:', p)
      return p
    }
    const getMime = async (str: string) => {
      try {
        const isBase64 = mahiro.utils.isBase64(str)
        if (isBase64) {
          logger.debug(`isBase64: ${isBase64}, str: ${str.slice(0, 30)}`)
          const res = await mahiro.utils.fileType.fileTypeFromBuffer(
            Buffer.from(str, 'base64'),
          )
          logger.debug('get mime from base64', res?.mime)
          if (res?.mime) {
            return {
              isPng: enablePng && res.mime === 'image/png',
              isJpg: enableJpg && res.mime === 'image/jpeg',
              isGif: enableGif && res.mime === 'image/gif',
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
          const isGif = detected?.isGif
          const originFileSize = (base64.length / 4) * 3
          const kbSize = originFileSize / 1024
          if (isPng) {
            logger.debug(`Will send png base64 image, size: ${kbSize}kb`)
            if (kbSize <= (pngLimit as number)) {
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
            if (kbSize <= (jpgLimit as number)) {
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
          if (isGif) {
            if (kbSize <= (gifLimit as number)) {
              return config
            }
            const tmpFile = fileSync({ postfix: '.gif' })
            await writeFile(tmpFile.name, base64, 'base64')
            const newFilePath = await transformImage(tmpFile.name)
            logger.debug(`New file path: ${newFilePath}`)
            const newBase64 = await readFile(newFilePath, 'base64')
            params.CgiRequest.Base64Buf = newBase64
            logger.success(
              `gif base64 image is greater than compress limit (${kbSize}kb) , compress`,
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
