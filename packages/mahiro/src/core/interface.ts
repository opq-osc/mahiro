import { join } from 'path'
import {
  EMsgTypeWithGroupManager,
  IMsg,
  IMsgBody,
  IMsgHead,
} from '../received/interface'
import {
  EUploadCommandId,
  ICgiRequest,
  IResponseDataWithSearchUser,
  ISendMsg,
  ISendMsgResponse,
  ISendParams,
} from '../send/interface'
import { z } from 'zod'
import { consola } from 'consola'
import { securityCopilotInterceptor } from '../interceptors/securityCopilot'
import type { Mahiro } from './'
import { AxiosInstance } from 'axios'
import type { WebSocket } from 'ws'

export interface IMahiroAdvancedOptions {
  /**
   * 是否忽略自己的消息
   * @default true
   */
  ignoreMyself?: boolean

  /**
   * mahiro 管理面板数据库路径
   * @default ${cwd}/mahiro.db
   */
  databasePath?: string

  /**
   * 发送消息拦截器
   * @default []
   */
  interceptors?: IMahiroInterceptor[]

  /**
   * 伴生bot，用于多Q场景
   * @default []
   * @example
   */
  sideQQs?: Array<number | ISideAccount>

  /**
   * 启用 redis kv
   * @example 'redis://localhost:6379'
   */
  redisKV?: string
}

export interface IAccountWs {
  ws: string
  wsIns: WebSocket
  wsRetrying: boolean
  wsConnected: boolean
}

export interface IAccont extends IAccountWs {
  url: string
  qq: number
  request: AxiosInstance
  /**
   * 消息栈
   */
  stack: IMahiroMsgStack
  /**
   * is side account
   */
  side: boolean
  /**
   * is server in local
   * will auto transform local image to base64 when server not in local
   */
  local: boolean
  /**
   * is multi OPQ instance connect
   */
  external: boolean
}

export interface ISideAccount {
  /**
   * ws 和 host + port 二选一提供
   */
  qq: number
  /**
   * @example ws://100.0.0.1:9000/ws
   */
  ws?: `ws://${string}`
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

export type IMahiroMsgStack = Map<number, IMahiroMsgHistory[]>

export interface IMahiroMsgHistory {
  time: number
  msg: ISendMsg
}

export interface IMahiroInterceptorContext {
  params: ISendParams
  data: ISendMsg
  logger: typeof consola
  stack: readonly IMahiroMsgHistory[]
}
export type IMahiroInterceptorFunction = (
  ctx: IMahiroInterceptorContext,
) => Promise<boolean> | boolean
export type IMahiroInterceptor = string | IMahiroInterceptorFunction

export interface IMahiroInitBase {
  /**
   * @version 3.0.0 可以不填，通过 MAHIRO_ACCOUNT_MAIN 传递
   */
  qq?: number
  advancedOptions?: IMahiroAdvancedOptions
  nodeServer?: INodeServerOpts
}

export const DEFAULT_NETWORK = {
  host: '0.0.0.0',
  port: 8086,
}
export const DEFAULT_ADANCED_OPTIONS: Required<IMahiroAdvancedOptions> = {
  ignoreMyself: true,
  databasePath: join(process.cwd(), 'mahiro.db'),
  interceptors: [securityCopilotInterceptor],
  sideQQs: [],
  redisKV: '',
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

export interface IGroupMessageConfigs {
  availablePlugins: string[]
}

export interface IMahiroMsgBase {
  msg: IMsgBody
  /**
   * from bot qq
   */
  qq: number
}

export interface IGroupMessage extends IMahiroMsgBase {
  groupId: number
  groupName: string
  userId: number
  userNickname: string
  /**
   * 高级配置，一般用于内部
   */
  configs: IGroupMessageConfigs
}

export type CancelListener = () => void
export type CallbackReturn<T> = T | Promise<T>

export type IMessageSession<T> = Array<{
  matched: T
}>

export type IOnAbstractMessage<T, K> = (
  useful: T,
  raw: IMsg,
) => CallbackReturn<K>

export type IOnGroupMessageFunc = IOnAbstractMessage<IGroupMessage, void>
export type IOnGroupMessageSessionMatcher = IOnAbstractMessage<
  IGroupMessage,
  boolean
>
export type IOnGroupMessage =
  | IOnGroupMessageFunc
  | IMessageSession<IOnGroupMessageSessionMatcher>

export interface IFriendMessage extends IMahiroMsgBase {
  userId: number
  userName: string
}

export type IOnFriendMessageFunc = IOnAbstractMessage<IFriendMessage, void>
export type IOnFriendMessageSessionMatcher = IOnAbstractMessage<
  IFriendMessage,
  boolean
>
export type IOnFriendMessage =
  | IOnFriendMessageFunc
  | IMessageSession<IOnFriendMessageSessionMatcher>

export interface ICallbacks {
  onGroupMessage: Record<string, IOnGroupMessage>
  onFreindMessage: Record<string, IOnFriendMessage>
  /**
   * native event (origin ws message)
   */
  onNativeEvent: Record<string, IOnNativeEvent>
  onGroupEvent: Record<string, IOnGroupEvent>
}

export type IOnNativeEvent = (event: IMsg) => CallbackReturn<void>

export interface IGroupEventBase {
  /**
   * from bot qq
   */
  qq: number
}

export type IGetUserInfo = () => Promise<
  ISendMsgResponse<IResponseDataWithSearchUser>
>

export interface IGroupEventExit {
  event: EMsgTypeWithGroupManager.exit
  getUserInfo: IGetUserInfo
}

export interface IGroupEventJoin {
  event: EMsgTypeWithGroupManager.join
  getUserInfo: IGetUserInfo
  /**
   * 获取触发事件的管理员个人信息
   */
  getAdminInfo: IGetUserInfo
}

export interface IGroupEventInvite {
  event: EMsgTypeWithGroupManager.invite

  // ? FIXME: 目前好像就是收不到这些信息
  // tips: IEventWithInvite['Tips']
  // getUserInfo: IGetUserInfo
  // getAdminInfo: IGetUserInfo
}

/**
 * admin only
 */
export interface IGroupEventAdminChange {
  event:
    | EMsgTypeWithGroupManager.cancel_admin
    | EMsgTypeWithGroupManager.set_admin
  /**
   * get more detailed info
   */
  getTargetInfo: IGetUserInfo
  targetNickName: string
  getAdminInfo: IGetUserInfo
  adminNickName: string
  /**
   * group info
   */
  groupName: string
  groupId: number
}

export type IGroupEvent =
  | IGroupEventExit
  | IGroupEventJoin
  | IGroupEventInvite
  | IGroupEventAdminChange

export type IOnGroupEvent = IOnAbstractMessage<IGroupEvent, void>

export type IApiMsg = Pick<ICgiRequest, 'Content' | 'AtUinLists' | 'Images'>

const msgSchema = z.object({
  Content: z.string().optional(),
  AtUinLists: z
    .array(
      z.object({
        Uin: z.number(),
        Nick: z.string().optional(),
      }),
    )
    .optional(),
  Images: z
    .array(
      z.object({
        FileId: z.number(),
        FileMd5: z.string(),
        FileSize: z.number(),
      }),
    )
    .optional(),
})

// 一些需要回传的额外信息
const pythonConfigsSchema = z.object({
  id: z.string(),
})
export const apiSchema = {
  sendGroupMessage: z.object({
    groupId: z.number(),
    msg: msgSchema,
    fastImage: z.string().optional(),
    qq: z.number(),
    configs: pythonConfigsSchema,
  }),
  sendFriendMessage: z.object({
    userId: z.number(),
    msg: msgSchema,
    fastImage: z.string().optional(),
    qq: z.number(),
    configs: pythonConfigsSchema,
  }),
} satisfies Record<string, z.ZodSchema<any>>
export interface IApiSendGroupMessage {
  groupId: number
  qq?: number
  msg?: Partial<IApiMsg>
  /**
   * 便捷字段，会被转换为 msg.Images
   * 必须传图片本地绝对路径或 url
   */
  fastImage?: string
  // todo: support voice
}

export interface IApiSendFriendMessage {
  userId: number
  qq?: number
  msg?: Partial<IApiMsg>
  /**
   * @see {@link IApiSendGroupMessage.fastImage}
   */
  fastImage?: string
}

export interface ISendApiOpts {
  CgiRequest: ICgiRequest
  qq: number
}

export interface ISearchUserOpts {
  /**
   * bot qq
   */
  qq: number
  /**
   * user string id
   */
  Uid: string
}

export interface IGetGroupListOpts {
  qq: number
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
    group: '/api/v1/recive/group',
    friend: '/api/v1/recive/friend',
  },
} as const

export enum EAsyncContextFrom {
  group = 'group',
  group_event = 'group_event',
  friend = 'friend',
  native = 'native',
}

export interface IAsyncContext {
  /**
   * plugin name
   */
  name: string
  qq: number
  /**
   * timestamp
   */
  time: number
  /**
   * 来源
   */
  from: EAsyncContextFrom
}
export const asyncHookUtils = {
  hash: (opts: IAsyncContext) => {
    return JSON.stringify(opts)
  },
  parse: (hash?: any) => {
    if (hash?.length) {
      try {
        return JSON.parse(hash) as IAsyncContext
      } catch {}
    }
  },
}

export interface IMahiroUploadFileOpts {
  commandId: EUploadCommandId
  qq: number
  /**
   * 可以是 url 或者本地文件绝对路径，会自动区分
   */
  file: string
}

export interface IMahiroUse {
  (mahiro: Mahiro): Promise<void> | void
}

export interface IMiddlewares {
  group: IMahiroGroupMiddleware[]
  friend: IMahiroFriendMiddleware[]
  native: IMahiroNativeMiddleware[]
}

export type IMahiroMiddleware<T = any> = (
  data: T,
) => (T | false) | Promise<T | false>

export type IMahiroGroupMiddleware = IMahiroMiddleware<IGroupMessage>

export type IMahiroFriendMiddleware = IMahiroMiddleware<IFriendMessage>

export type IMahiroNativeMiddleware = IMahiroMiddleware<IMsg>

export enum EMiddleware {
  group = 'middleware-group',
  friend = 'middleware-friend',
  native = 'middleware-native',
}

export const __UNSTABLE_PYTHON_SERVER_BASE =
  process.env.MAHIRO_UNSTABLE_PYTHON_SERVER_BASE || `http://0.0.0.0`

export const PYTHON_SERVER_APIS = {
  sendGroupMsg: `/recive/group`,
  sendFriendMsg: `/recive/friend`,
  sendAuthToken: `/recive/auth`,
  noticeMahiroStarted: `/recive/started`,
  health: `/recive/health`,
} as const

export interface ISendToPythonData extends IMahiroMsgBase {
  raw: IMsg
  /**
   * maybe extends group or friend message
   */
  [key: string]: any
}

export interface IPythonHealthResponse {
  code: number
  version: string
}

export interface ISessionData {
  stage: number
}

export const getMahiroSessionTTL = () => {
  const env = process.env.MAHIRO_SESSION_TTL
  if (env?.length) {
    return parseInt(env, 10)
  }
  return 10 * 1e3
}

export const OPQ_APIS = {
  upload: '/v1/upload',
  common: '/v1/LuaApiCaller',
} as const

export interface IAsyncContextInfo extends Pick<IAsyncContext, 'from' | 'qq'> {
  [key: string]: any
}

export type IMatcherOpts = Pick<IMsgHead, 'FromType' | 'MsgType' | 'C2cCmd'>

/**
 * 与 EAvatarSize 的区别：空间接口允许的 size 范围不一样
 */
export enum EQzoneAvatarSize {
  s_100 = 100,
  s_200 = 200,
  s_640 = 640,
}

export interface IAvatarWay {
  getUrl: (account: number, size: EQzoneAvatarSize) => string
}

export interface IQzoneInfo {
  avatar: `http://qlogo4.store.qq.com/qzone/${string}/${string}/100`
  nickname: string
}

export const getUserNamePatchTTL = () => {
  const env = process.env.MAHIRO_USERNAME_PATCH_TTL
  if (env?.length) {
    return parseInt(env, 10)
  }
  // default: 10min
  return 10 * 60 * 1e3
}
