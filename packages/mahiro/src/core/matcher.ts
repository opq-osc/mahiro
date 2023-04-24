import { EC2cCmd, EFromType, EMsgType } from '../received/interface'
import { IMatcherOpts } from './interface'

export class Matcher {
  constructor() {}

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
