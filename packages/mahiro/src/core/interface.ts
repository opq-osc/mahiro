import { IMsg, IMsgBody } from '../received/interface'
import { ICgiRequest } from '../send/interface'
import { z } from 'zod'

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
  nodeServer?: INodeServerOpts
}

export const DEFAULT_NETWORK = {
  host: '0.0.0.0',
  port: 8086,
}
export const DEFAULT_ADANCED_OPTIONS: Required<IMahiroAdvancedOptions> = {
  ignoreMyself: true,
}
export interface IMahiroInitWithSimple extends IMahiroInitBase {
  /**
   * @default 0.0.0.0
   * @example 100.0.0.1
   */
  host?: string
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

const msgSchema = z.object({
  Content: z.string(),
  AtUinLists: z.array(z.any()).optional(),
  Images: z.array(z.any()).optional()
})
export const apiSchema = {
  sendGroupMessage: z.object({
    groupId: z.number(),
    msg: msgSchema
  }),
  sendFriendMessage: z.object({
    userId: z.number(),
    msg: msgSchema
  })
} satisfies Record<string, z.ZodSchema<any>>
export interface IApiSendGroupMessage {
  groupId: number
  msg: IApiMsg
}

export interface IApiSendFriendMessage {
  userId: number
  msg: IApiMsg
}

const getDefaultNodeServerPort = () => {
  const fallback = 8098
  const env = process.env.MAHIRO_NODE_URL
  if (env?.length) {
    const url = new URL(env)
    return parseInt(url.port, 10) || fallback
  }
  return fallback
}
const getDefaultPythonServerPort = () => {
  const env = process.env.MAHIRO_PYTHON_PORT
  if (env?.length) {
    return parseInt(env, 10)
  }
  return 8099
}
export const DEFAULT_NODE_SERVER: Required<INodeServerOpts> = {
  port: getDefaultNodeServerPort(),
  pythonPort: getDefaultPythonServerPort(),
}
export interface INodeServerOpts {
  port?: number
  pythonPort?: number
}
export const SERVER_ROUTES = {
  recive: {
    group: '/recive/group',
    friend: '/recive/friend',
  }
} as const
