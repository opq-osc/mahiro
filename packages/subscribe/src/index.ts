import type { IMahiroGroupMiddleware, IMahiroUse } from 'mahiro'
import { nanoid } from 'nanoid'
import prettyMilliseconds from 'pretty-ms'

const DB_KEY = 'mahiro-subscribe'
const DB_NAMESPACE = 'mahiro-subscribe'

export interface ITokenInfo {
  token: string
}

export interface ITokens {
  [period: string]: ITokenInfo[]
}

export interface IMahiroSubscribeOpts {
  /**
   * periods of tokens
   * @default '[1 day, 3 day, 7 day, 15 day, 30 day, 90 day, 180 day, 365 day]'
   */
  periods?: number[]
  /**
   * max count of tokens
   * @default 10
   */
  maxCount?: number
  /**
   * command prefix
   * @default '.use'
   */
  commandPrefix?: string
  /**
   * redis connection string
   * @default 'redis://localhost:6379'
   */
  redis?: `redis://${string}:${number}`
  /**
   * @todo auto add renewers to admin
   */
  // autoAddToAdmin?: boolean
}

const defaultRedis = 'redis://localhost:6379'
const defaultCommandPrefix = '.use'
const defaultMaxCount = 10

const dayMs = 1e3 * 60 * 60 * 24
const defaultPeriods = [
  // 1 day
  dayMs,
  // 3 day
  dayMs * 3,
  // 7 day
  dayMs * 7,
  // 15 day
  dayMs * 15,
  // 30 day
  dayMs * 30,
  // 90 day
  dayMs * 90,
  // 180 day
  dayMs * 180,
  // 365 day
  dayMs * 365,
] satisfies number[]

const UUID_LENGTH = 21
export const MahiroSubscribe = (opts: IMahiroSubscribeOpts = {}) => {
  const {
    periods = defaultPeriods,
    maxCount = defaultMaxCount,
    redis = defaultRedis,
    commandPrefix = defaultCommandPrefix,
  } = opts
  const use: IMahiroUse = async (mahiro) => {
    const logger = mahiro.logger.withTag(
      'mahiro-subscribe',
    ) as typeof mahiro.logger

    logger.info(`[Mahiro Subscribe] init, redis connection string: ${redis}`)

    const { Keyv, KeyvRedis } = mahiro.utils
    const redisIns = new Keyv({
      store: new KeyvRedis(redis),
      namespace: DB_NAMESPACE,
    })
    // try read
    await redisIns.get(DB_KEY)
    logger.success(`[Mahiro Subscribe] redis connected`)

    // redis opertaion
    const read = async () => {
      const v = await redisIns.get(DB_KEY)
      logger.debug(`[Mahiro Subscribe] read from redis...`)
      return (v ? JSON.parse(v) : v) as ITokens | undefined
    }
    const write = async (value: ITokens) => {
      const stringify = JSON.stringify(value)
      await redisIns.set(DB_KEY, stringify)
      logger.debug(`[Mahiro Subscribe] write to redis...`)
    }

    const addTokens = async () => {
      // get all tokens from kv
      const tokens = (await read()) || {}
      // check and add new token
      periods.forEach((period) => {
        const arr = tokens?.[period]
        if (arr?.length) {
          // check max count
          const count = arr.length
          const needAdd = count < maxCount
          if (needAdd) {
            const needCount = maxCount - count
            Array(needCount)
              .fill(1)
              .forEach(() => {
                const newObj = {
                  token: getOneUUID(),
                } satisfies ITokenInfo
                // push
                tokens[period].push(newObj)
              })
            logger.info(
              `[Mahiro Subscribe] add ${needCount} tokens for ${prettyMilliseconds(
                period,
              )}`,
            )
          }
        } else {
          // create new array
          tokens[period] = Array(maxCount)
            .fill(1)
            .map(() => {
              return {
                token: getOneUUID(),
              } satisfies ITokenInfo
            })
          logger.info(
            `[Mahiro Subscribe] create ${maxCount} tokens for ${prettyMilliseconds(
              period,
            )}`,
          )
        }
      })
      // set
      await write(tokens)
    }
    addTokens()

    const checkToken = async (t: string) => {
      const values: ITokens | undefined = await read()
      if (!values) {
        return
      }
      let matched: { period: number; token: ITokenInfo } | undefined
      Object.entries(values).some(([period, tokens]) => {
        const matchedToken = tokens.find((token) => token.token === t)
        if (matchedToken) {
          matched = {
            period: Number(period),
            token: matchedToken,
          }
          return true
        }
      })
      // if matched, remove token
      if (matched) {
        logger.success(
          `[Mahiro Subscribe] consume token ${
            matched.token.token
          } for ${prettyMilliseconds(matched.period)}`,
        )
        const { period, token } = matched
        const arr = values?.[period]
        if (arr) {
          const index = arr.findIndex((t) => t.token === token.token)
          if (~index) {
            const newToken = {
              token: getOneUUID(),
            } satisfies ITokenInfo
            arr[index] = newToken
            await write(values)
          }
        }
      }
      return matched
    }

    // listen active message
    const mahiroSubscribeMiddleware: IMahiroGroupMiddleware = async (data) => {
      const msg = data?.msg?.Content || ''
      const trimed = msg.trim()
      if (!trimed?.length) {
        return data
      }
      // match command
      const isMatched = trimed.startsWith(commandPrefix)
      if (!isMatched) {
        return data
      }
      const token = trimed.slice(commandPrefix.length).trim()
      const isLengthEqual = token.length === UUID_LENGTH
      if (!isLengthEqual) {
        return data
      }
      // check token
      const matched = await checkToken(token)
      if (!matched) {
        return data
      }
      // add period to group
      const { period } = matched
      const groupId = data.groupId
      const group = (await mahiro.db.getGroups()).find(
        (i) => i.group_id === groupId,
      )
      let willSendExpiredAt = ''
      if (!group) {
        // new
        const now = Date.now()
        const expired_at_timestamp = now + period
        const expired_at = mahiro.utils
          .dayjs(expired_at_timestamp)
          .format('YYYY-MM-DD HH:mm:ss')
        const defaultPluginIds = (await mahiro.db.getPlugins())
          .filter((i) => i.enabled)
          .map((i) => i.id)
        await mahiro.db.addGroup({
          admins: [],
          // open all enabled plugins by default
          plugins: defaultPluginIds,
          link_qqs: [data.qq],
          name: `自动添加:${groupId}`,
          group_id: groupId,
          expired_at,
        })
        willSendExpiredAt = expired_at
        mahiro.logger.success(
          `[Mahiro Subscribe] add group ${groupId} with expired at ${expired_at}`,
        )
      } else {
        // update
        const now = Date.now()
        const originExpiredAt = mahiro.utils.dayjs(group.expired_at).valueOf()
        const isExpired = now > originExpiredAt
        const newExpiredAt = isExpired ? now + period : originExpiredAt + period
        const expired_at = mahiro.utils
          .dayjs(newExpiredAt)
          .format('YYYY-MM-DD HH:mm:ss')
        await mahiro.db.updateGroup({
          id: group.id,
          expired_at,
        })
        willSendExpiredAt = expired_at
        mahiro.logger.success(
          `[Mahiro Subscribe] update group ${groupId} with expired at ${expired_at}`,
        )
      }
      // send message to group
      await mahiro.sendGroupMessage({
        groupId,
        msg: {
          Content: `订阅成功，有效期至${willSendExpiredAt}`,
        },
      })
      // drop message
      return false
    }
    mahiro.registerGroupMiddleware(mahiroSubscribeMiddleware)

    // add web panel
    const getPanelHtml = async () => {
      const data = (await read()) || {}
      const readableData = Object.entries(data).reduce<typeof data>(
        (acc, [period, tokens]) => {
          const readableKey = prettyMilliseconds(Number(period))
          acc[readableKey] = tokens
          return acc
        },
        {},
      )
      const html = /* html */ `
<div class="text-2xl text-600 p-2">Mahiro Subscribe Tokens</div>
<div class="p-2">
  <pre class="pt-0 mt-0 max-h-screen overflow-auto">
${JSON.stringify(readableData, null, 2)}
  </pre>
</div>  
`.trimStart()
      return html
    }
    mahiro.db.registerWebPanel({
      name: DB_KEY,
      content: getPanelHtml,
    })

    logger.success(`[Mahiro Subscribe] init success`)
  }

  return use
}

function getOneUUID() {
  return nanoid(UUID_LENGTH)
}
