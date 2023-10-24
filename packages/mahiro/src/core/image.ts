import consola from 'consola'
import type { Mahiro } from '.'
import { IGetImageSizeOpts, IImageSize } from './interface'
import {
  VALID_EXTS,
  detectUrlImageType,
  getImageTypeByBase64,
  hasValidImageExt,
} from '../utils/image'
import { fileSync } from 'tmp-promise'
import download from 'download'
import { existsSync, writeFileSync } from 'fs'
import imageSize from 'image-size'
import { isAbsolute } from 'path'
import { noop } from 'lodash'

export class Image {
  mahiro: Mahiro

  logger = consola.withTag('image') as typeof consola

  constructor(opts: { mahiro: Mahiro }) {
    this.mahiro = opts.mahiro
  }

  private createTmpFile(opts: { ext: string }) {
    const { ext } = opts
    let tmpFile = fileSync({
      postfix: ext,
    })
    const cleanup = () => {
      setTimeout(() => {
        this.logger.debug(
          `[Image/createTmpFile] clear tmp file ${tmpFile.name}`,
        )
        tmpFile.removeCallback()
        tmpFile = null
      }, 5 * 1e3)
    }
    return { tmpFile, cleanup }
  }

  /**
   * safe get image size from filepath
   */
  safeImageSizeOf = (p: string): IImageSize | undefined => {
    try {
      const size = imageSize(p)
      if (!size?.height || !size?.width) {
        this.logger.error(
          `[safeImageSize] get image size from ${p} failed, size: ${JSON.stringify(
            size,
          )}`,
        )
        return
      }
      this.logger.debug(
        `[safeImageSize] get image size from ${p} success, size: ${JSON.stringify(
          size,
        )}`,
      )
      return {
        width: size.width,
        height: size.height,
      }
    } catch {
      this.logger.error(`[safeImageSize] get image size from ${p} failed`)
      return
    }
  }

  /**
   * get image size with `url` or `base64` or `filepath`
   */
  async getImageSize(opts: IGetImageSizeOpts): Promise<IImageSize | undefined> {
    const { url, base64, filepath } = opts
    let finalFilePath: string | undefined
    let finalCleanup: () => void = noop
    // url
    if (url?.length) {
      const imageExt = await detectUrlImageType(url)
      this.logger.debug(
        `[ImageSizeDetector] url: ${url} has ext suffix: ${imageExt} (from detectUrlImageType)`
      )
      if (!imageExt?.length) {
        this.logger.error(
          `[ImageSizeDetector] url: ${url} has invalid ext suffix, current only support ${VALID_EXTS.join(
            ', ',
          )} image format`,
        )
        return
      }
      const { tmpFile, cleanup } = this.createTmpFile({ ext: imageExt })
      // try download and save
      try {
        this.logger.debug(
          `[ImageSizeDetector] try download image from ${url} to ${tmpFile.name}`,
        )
        writeFileSync(tmpFile.name, await download(url, { timeout: 10 * 1e3 }))
      } catch {
        this.logger.error(
          `[ImageSizeDetector] download image from ${url} failed, will drop this image`,
        )
        cleanup()
        return
      }
      // file save ok
      finalFilePath = tmpFile.name
      finalCleanup = cleanup
    } else if (base64?.length) {
      const detectedImageType = await getImageTypeByBase64(base64)
      if (!detectedImageType) {
        this.logger.error(
          `[ImageSizeDetector] base64: ${base64.slice(0, 50)} is not a valid image`,
        )
        return
      }
      const { tmpFile, cleanup } = this.createTmpFile({
        ext: `.${detectedImageType}`,
      })
      // save base64 to tmp file
      try {
        this.logger.debug(
          `[ImageSizeDetector] try save base64 image to ${tmpFile.name}`,
        )
        writeFileSync(tmpFile.name, base64, 'base64')
      } catch {
        this.logger.error(
          `[ImageSizeDetector] save base64 image to ${tmpFile.name} failed`,
        )
        cleanup()
        return
      }
      // file save ok
      finalFilePath = tmpFile.name
      finalCleanup = cleanup
    } else if (filepath?.length) {
      const isExist = existsSync(filepath)
      if (!isExist) {
        this.logger.error(
          `[ImageSizeDetector] filepath: ${filepath} is not exist`,
        )
        return
      }
      const isAbsolutePath = isAbsolute(filepath)
      if (!isAbsolutePath) {
        this.logger.error(
          `[ImageSizeDetector] filepath: ${filepath} is not absolute path, will drop this image`,
        )
        return
      }
      const hasValidExt = hasValidImageExt(filepath)
      if (!hasValidExt) {
        this.logger.error(
          `[ImageSizeDetector] filepath: ${filepath} has valid ext suffix, current only support ${VALID_EXTS.join(
            ', ',
          )} as image ext`,
        )
        return
      }
      // file save ok
      finalFilePath = filepath
    } else {
      throw new Error(
        `[ImageSizeDetector] invalid opts: ${JSON.stringify(opts)}`,
      )
    }
    const size = this.safeImageSizeOf(finalFilePath!)
    finalCleanup()
    return size
  }
}
