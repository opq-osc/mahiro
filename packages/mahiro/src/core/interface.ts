import { IMsg, IMsgBody } from '../received/interface'
import { ICgiRequest } from '../send/interface'

export interface IMahiroAdvancedOptions {
  /**
   * 是否忽略自己的消息
   * @default true
   */
  ignoreMyself?: boolean

  // TODO: 发消息队列
  // messageQueue?: IMahiroMessageQueue
}

export interface IMahiroInitBase {
  qq: number
  advancedOptions?: IMahiroAdvancedOptions
}

export const DEFAULT_PORT = 8086
export const DEFAULT_ADANCED_OPTIONS: Required<IMahiroAdvancedOptions> = {
  ignoreMyself: true,
}
export interface IMahiroInitWithSimple extends IMahiroInitBase {
  /**
   * @example 100.0.0.1
   */
  host: string
  /**
   * @default 8086
   */
  port?: number
}

export interface IMahiroInitWithWs extends IMahiroInitBase {
  /**
   * @example ws://100.0.0.1:9000/ws
   */
  ws: `ws://${string}`
}

export type IMahiroOpts = IMahiroInitWithSimple | IMahiroInitWithWs

export interface IGroupMessage {
  groupId: number
  groupName: string
  userId: number
  userNickname: string
  msg: IMsgBody
}

export type CancelListener = () => void
export type CallbackReturn = void | Promise<void>

export interface IOnGroupMessage {
  (useful: IGroupMessage, raw: IMsg): CallbackReturn
}

export interface IFriendMessage {
  userId: number
  userName: string
  msg: IMsgBody
}

export interface IOnFriendMessage {
  (useful: IFriendMessage, raw: IMsg): CallbackReturn
}

export interface ICallbacks {
  onGroupMessage: IOnGroupMessage[]
  onFreindMessage: IOnFriendMessage[]
}

export type IApiMsg = Pick<ICgiRequest, 'Content' | 'AtUinLists' | 'Images'>

export interface IApiSendGroupMessage {
  groupId: number
  msg: IApiMsg
}

export interface IApiSendFriendMessage {
  userId: number
  msg: IApiMsg
}
