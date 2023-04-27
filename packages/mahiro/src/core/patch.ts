import { consola } from 'consola'
import type { Mahiro } from '.'
import { getUserNamePatchTTL } from './interface'

export class Patcher {
  mahiro: Mahiro

  prefix = 'mahiro-user-name-cache'
  ttl = getUserNamePatchTTL()
  logger = consola.withTag('patcher') as typeof consola

  constructor(opts: { mahiro: Mahiro }) {
    this.mahiro = opts.mahiro
  }

  private withPrefix(key: number | string) {
    return `${this.prefix}:${key}`
  }

  async getUserNameFromCache(account: number) {
    const key = this.withPrefix(account)
    const useRedis = this.mahiro.db.isRedisKVAvailable
    this.logger.debug(`patch use cache from ${useRedis ? 'redis' : 'sqlite'}`)
    const setImpl = useRedis
      ? this.mahiro.db.redisKV.set.bind(this.mahiro.db.redisKV)
      : this.mahiro.db.kv.set.bind(this.mahiro.db.kv)
    const getImpl = useRedis
      ? this.mahiro.db.redisKV.get.bind(this.mahiro.db.redisKV)
      : this.mahiro.db.kv.get.bind(this.mahiro.db.kv)
    // get from redis
    this.logger.debug(`get user name from cache: ${key}`)
    const name = await getImpl(key)
    if (name?.length) {
      this.logger.debug(`user name patch hit: ${name}`)
      return name
    }
    // get from network
    const info = await this.mahiro.avatar.getUserQzoneInfo(account)
    if (info?.nickname?.length) {
      // set to redis
      await setImpl(key, info.nickname, this.ttl)
      this.logger.debug(
        `account(${account}) user name patch set: ${info.nickname}, ttl: ${this.ttl}ms`,
      )
      return info.nickname
    }
    this.logger.warn(`api error, user name patch miss`)
  }
}
