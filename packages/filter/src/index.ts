import { existsSync, readFileSync } from 'fs'
import { IMahiroUse } from 'mahiro'
import { findAllMatch, findLeftFirstMatch } from 'hoshino'
import { isAbsolute } from 'path'

export interface MahiroFilter {
  /**
   * sensitive words data path (e.g. path.join(__dirname, './data.txt'))
   */
  dataPath: string
  /**
   * check received message, drop when containing sensitive words
   * @default true
   */
  checkReceived?: boolean
  /**
   * check send message, drop when containing sensitive words
   * NOTE: cannot check images
   * @default true
   */
  checkSend?: boolean
  /**
   * messages containing sensitive words counts > threshold, will remove the message
   * @default 1
   */
  threshold?: number
}

let globalLines: string[] = []

export const MahiroFilter = (opts: MahiroFilter) => {
  const {
    dataPath,
    checkReceived = true,
    checkSend = true,
    threshold = 1,
  } = opts

  if (!existsSync(dataPath)) {
    throw new Error(`Mahiro filter plugin 'dataPath' is required`)
  }

  if (!dataPath.endsWith('.txt')) {
    throw new Error('Mahiro filter data file must be in ".txt" format')
  }

  if (!isAbsolute(dataPath)) {
    throw new Error(`Mahiro filter data file path must be an absolute path`)
  }

  const use: IMahiroUse = (mahiro) => {
    const logger = mahiro.logger.withTag(
      'mahiro-filter',
    ) as typeof mahiro.logger

    logger.info(`Mahiro filter plugin starting...`)

    const lodash = mahiro.utils.lodash
    const chalk = mahiro.utils.chalk

    const content = readFileSync(dataPath, 'utf-8')
    const lines = lodash
      .trim(content)
      .split('\n')
      .map((i) => lodash.trim(i))
      .filter((i) => i?.length)

    const oneWordLines = lines.filter((i) => i.length <= 1)
    if (oneWordLines.length) {
      logger.info(
        `Number of words containing only onw word lines: ${chalk.yellow(
          oneWordLines.length,
        )}`,
      )
    }

    globalLines = lodash.uniq(lines)
    logger.info(`Loaded ${chalk.green(globalLines.length)} lines of words`)

    // received
    if (checkReceived) {
      mahiro.registerGroupMiddleware(async (data) => {
        const msg = data?.msg?.Content
        if (msg?.length) {
          const trimmedMsg = lodash.trim(msg)
          if (trimmedMsg?.length) {
            const isDanger = await hasSensitiveWords(trimmedMsg, threshold)
            if (isDanger) {
              logger.debug(
                `[Received] Contains sensitive words, Block ${trimmedMsg?.slice(
                  0,
                  50,
                )}`,
              )
              return false
            }
          }
        }
        return data
      })
    }

    // send
    if (checkSend) {
      mahiro.registerInterceptor(async (ctx) => {
        const msg = ctx?.data?.CgiRequest?.Content
        if (msg?.length) {
          const trimmedMsg = lodash.trim(msg)
          if (trimmedMsg?.length) {
            const isDanger = await hasSensitiveWords(trimmedMsg, threshold)
            if (isDanger) {
              logger.info(
                `[Send] Contains sensitive words, Block ${trimmedMsg?.slice(
                  0,
                  50,
                )}`,
              )
              return false
            }
          }
        }
        return true
      })
    }
  }

  return use
}

async function hasSensitiveWords(text: string, threshold: number) {
  try {
    const checkOne = threshold <= 1
    if (checkOne) {
      const result = await findLeftFirstMatch({
        haystack: text,
        patterns: globalLines,
      })
      if (result?.matched) {
        return true
      }
    } else {
      const result = await findAllMatch({
        haystack: text,
        patterns: globalLines,
      })
      return result?.length >= threshold
    }
  } catch {
    return false
  }
}
