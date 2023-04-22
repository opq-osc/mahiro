import { consola } from 'consola'
import type { Mahiro } from '.'
import { IMessageSession, ISessionData, getMahiroSessionTTL } from './interface'
import { isFunction } from 'lodash'
import { tryParse } from '../utils'

export class Session {
  mahiro!: Mahiro
  sessionPrefix = 'mahiro:session:'
  enabled = false
  logger = consola.withTag('session') as typeof consola
  // default 10s
  ttl = getMahiroSessionTTL()

  constructor(opts: { mahiro: Mahiro }) {
    this.mahiro = opts.mahiro
  }

  async isSession(callback: IMessageSession<any> | Function) {
    const isLikeSession = Array.isArray(callback)
    if (isLikeSession) {
      if (callback.length < 2) {
        throw new Error('Session callback must have at least 2 functions')
      }
      const isSchemaError = callback.some((i) => !isFunction(i.matched))
      if (isSchemaError) {
        throw new Error('Session.matched callback must be function')
      }
      // check session available
      await this.checkSessionAvailable()
      return true
    }
    return false
  }

  private async checkSessionAvailable() {
    if (this.enabled) {
      return
    }
    const key = `${this.sessionPrefix}test`
    const value = `test`
    await this.mahiro.db.redisKV.set(key, value)
    const expectValue = await this.mahiro.db.redisKV.get(key)
    if (expectValue === value) {
      this.enabled = true
    }
  }

  async callSession(opts: {
    sessions: IMessageSession<any>
    id: string
    args: any[]
  }) {
    const { sessions, id, args } = opts
    this.logger.debug(`session (${id}) call`)
    const key = `${this.sessionPrefix}${id}`
    const redisValue = (await this.mahiro.db.redisKV.get(key)) as
      | string
      | undefined
    let stage = 0
    if (redisValue) {
      stage = tryParse<ISessionData>(redisValue)?.stage || 0
    }
    this.logger.debug(`session (${key}) stage`, stage)
    const stageFunc = sessions[stage]
    if (!stageFunc) {
      this.logger.warn(
        `session (${key}) stage (${stage}) not found, will clear`,
      )
      // clear session
      await this.mahiro.db.redisKV.delete(key)
      return
    }
    const isMatched = (await stageFunc.matched(...args)) as boolean
    const isLastStage = stage === sessions.length - 1
    if (isLastStage) {
      // clear
      this.logger.debug(
        `session (${key}) stage (${stage}) is last stage, will clear`,
      )
      await this.mahiro.db.redisKV.delete(key)
      return
    }
    if (isMatched) {
      // move to next stage
      stage++
      const data: ISessionData = {
        stage,
      }
      this.logger.debug(
        `session (${key}) stage (${
          stage - 1
        }) matched, will move to next stage (${stage})`,
      )
      await this.mahiro.db.redisKV.set(key, JSON.stringify(data), this.ttl)
      return
    }
    // not matched
    this.logger.debug(
      `session (${key}) stage (${stage}) not matched, will clear`,
    )
    // clear session
    await this.mahiro.db.redisKV.delete(key)
  }
}
