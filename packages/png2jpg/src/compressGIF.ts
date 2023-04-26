import { existsSync } from 'fs'
import { dir } from 'tmp-promise'

const imagemin = require('imagemin')
const imageGifsicle = require('@xn-sakina/imagemin-gifsicle')

export const compressGIF = async (file: string) => {
  if (!existsSync(file)) {
    return
  }
  try {
    const tmpDir = await dir()
    const files = await imagemin([file], {
      destination: tmpDir.path,
      plugins: [
        // we cannot use `optimizationLevel: 3`, it is very slow
        imageGifsicle(),
      ],
    })
    const output = files?.[0]?.destinationPath
    if (output?.length) {
      process.env.DEBUG && console.log('compress gif success')
      return output as string
    }
    throw new Error('compress gif failed')
  } catch (e) {
    console.log('compress gif failed')
    process.env.DEBUG && console.log(e)
    return
  }
}
