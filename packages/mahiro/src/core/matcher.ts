import { isNil } from 'lodash'
import { EC2cCmd, EFromType, EMsgType } from '../received/interface'
import { IMatcherOpts } from './interface'
import { consola } from 'consola'

export class Matcher {
  logger = consola.withTag('matcher') as typeof consola

  constructor() {}

  ensureConditionKeysExist(opts: IMatcherOpts) {
    if (isNil(opts?.FromType) || isNil(opts?.MsgType) || isNil(opts?.C2cCmd)) {
      return false
    }
    return true
  }

  matchGroupMessage(opts: IMatcherOpts) {
    const { FromType, MsgType, C2cCmd } = opts
    return (
      FromType === EFromType.group &&
      MsgType === EMsgType.group &&
      C2cCmd === EC2cCmd.group
    )
  }

  matchFriendMessage(opts: IMatcherOpts) {
    const { FromType, MsgType, C2cCmd } = opts
    return (
      FromType === EFromType.friends &&
      MsgType === EMsgType.friends &&
      C2cCmd === EC2cCmd.firends
    )
  }
}
