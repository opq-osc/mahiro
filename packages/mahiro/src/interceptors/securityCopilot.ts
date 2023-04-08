import chalk from 'mahiro/compiled/chalk'
import { IMahiroInterceptorContext } from '../core/interface'
import { EToType } from '../send/interface'
import { sleep } from '../utils'

// todo: prevent continuous repeat send image
// todo: report danger msg to admin
export const securityCopilotInterceptor = async (
  ctx: IMahiroInterceptorContext,
) => {
  const { data, logger, stack } = ctx
  const CgiRequest = data?.CgiRequest
  const content = CgiRequest?.Content

  if (content?.length) {
    // 禁 At
    const hasRawAT = ~content.indexOf('[ATUSER(')
    if (hasRawAT) {
      const danger = chalk.red('Use raw [ATUSER()] is very dangerous')
      logger.warn(
        `[Security Copilot] ${danger}, please use @{nickname} instead.`,
      )
    }
    // 发言三次重复，第四次截断
    const dangerCount = 3
    let equalCount = 0
    for (let i = stack.length - 1; i >= 0; i--) {
      const msg = stack[i].msg.CgiRequest?.Content
      if (!msg?.length) {
        break
      }
      if (msg === content) {
        equalCount++
      } else {
        break
      }
      if (equalCount >= dangerCount) {
        logger.error(
          `[Security Copilot] ${chalk.red(
            `The message is repeated ${dangerCount} times, drop it. (${content})`,
          )}`,
        )
        return false
      }
    }
    // 1s 发两条消息，立即减速 1000 - 2000ms
    if (stack.length >= 2) {
      const last = stack[stack.length - 1].time
      const last2 = stack[stack.length - 2].time
      // last2 --- last --- now
      const isSmallGap = last - last2 < 1000
      if (isSmallGap) {
        const now = Date.now()
        const isNeedSleep = now - last < 1000
        if (isNeedSleep) {
          // sleep random time
          const sleepTime = Math.floor(Math.random() * 1000) + 1000
          logger.warn(
            `[Security Copilot] ${chalk.yellow(
              `Sending messages too fast, it will sleep ${sleepTime}ms.`,
            )}`,
          )
          await sleep(sleepTime)
          return true
        }
      }
    }
  }

  // 禁私聊
  const isGroupTarget = CgiRequest?.ToType === EToType.group
  if (!isGroupTarget) {
    logger.warn(
      `[Security Copilot] Private chat is very danger, please use group chat only.`,
    )
  }

  // more security check ...

  return true
}
