import { join } from 'path'
import {
  EMsgTypeWithGroupManager,
  IMsg,
  IMsgBody,
  IMsgHead,
} from '../received/interface'
import {
  EAvatarSize,
  ESendCmd,
  EUploadCommandId,
  IBanMemberTo,
  ICgiRequest,
  ICgiRequestUnion,
  IDropTo,
  IExitTo,
  IKickMemberTo,
  IReplyTo,
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
  replyTo: IReplyTo
  dropTo: IDropTo
  banTo: IBanMemberTo
  kickTo: IKickMemberTo
  exitTo: IExitTo
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

export interface IApiSendGroupJsonMessage {
  groupId: number
  qq?: number
  /**
   * json string or object
   * @example "{\"key\": \"value\"}"
   * @example JSON.stringify({key: "value"})
   * @example {key: "value"}
   */
  json: string | Record<string, any>
}

export interface IApiSendGroupXmlMessage {
  groupId: number
  qq?: number
  /**
   * XML内容 需转义
   */
  xml: string
}

export interface ISendApiOpts<
  T extends ICgiRequestUnion = ICgiRequest,
  K extends ESendCmd = ESendCmd.send,
> {
  CgiCmd?: K
  CgiRequest: T
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

export enum EMahiroUploadFileType {
  image = 'image',
  // TODO: support voice
  // voice = 'voice',
}

export interface IMahiroUploadFileOpts {
  commandId: EUploadCommandId
  qq: number
  /**
   * 可以是 url 或者本地文件绝对路径，会自动区分
   */
  file: string
  /**
   * 上传文件类型
   */
  type: EMahiroUploadFileType
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

export const __unstable_python_server_base =
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
  cluster_info: '/v1/clusterinfo?isShow=1',
} as const

export interface IAsyncContextInfo extends Pick<IAsyncContext, 'from' | 'qq'> {
  [key: string]: any
}

export type IMatcherOpts = Pick<IMsgHead, 'FromType' | 'MsgType' | 'C2cCmd'>

export interface IAvatarWay {
  getUrl: (account: number, size: EAvatarSize) => string
}

export interface IQzoneInfo {
  avatar: string
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

export interface IRailOpts {
  mahiro: Mahiro
}

export interface IAnoOpts {
  mahiro: Mahiro
}

export const replyToSchema = z.object({
  MsgSeq: z.number(),
  MsgTime: z.number(),
  MsgUid: z.number(),
  FromUin: z.number(),
})

export interface IReplyGroupMessageOpts {
  to: IReplyTo
  qq?: number
  msg?: Partial<IApiMsg>
  /**
   * 便捷字段，会被转换为 msg.Images
   * 必须传图片本地绝对路径或 url
   */
  fastImage?: string
}

export interface IBakaOpts {
  mahiro: Mahiro
}

export const dropSchema = z.object({
  MsgSeq: z.number(),
  MsgRandom: z.number(),
  FromUin: z.number(),
})

export const exitSchema = z.object({
  FromUin: z.number(),
})

export interface IDropGroupMessageOpts {
  to: IDropTo
  /**
   * bot qq
   */
  qq?: number
}

export interface IExitGroupQuickOpts {
  /**
   * quick usage `data.exitTo`
   */
  to?: IExitTo
}

export interface IExitGroupOpts extends IExitGroupQuickOpts {
  /**
   * manual exit, should use `groupId`
   */
  groupId?: number
  /**
   * bot qq
   */
  qq?: number
}

export interface ISendGroupMessageReturn extends ISendMsgResponse {
  drop: () => Promise<void>
}

export interface IMessageSnapshotGetterOpts {
  FromUin: number
  MsgSeq?: number
  MsgTime?: number
}

export const getMessageSnapshotTTL = () => {
  const env = process.env.MAHIRO_MESSAGE_SNAPSHOT_TTL
  if (env?.length) {
    return parseInt(env, 10)
  }
  // default: 2min
  return 2 * 60 * 1e3
}

// for group list cache
// for group member list cache
export const getGroupDataTTL = () => {
  const env = process.env.MAHIRO_GROUP_DATA_TTL
  if (env?.length) {
    return parseInt(env, 10)
  }
  // default: 20 mins
  return 20 * 60 * 1e3
}

export const banGroupMemberSchema = z.object({
  Uin: z.number(),
  Uid: z.string(),
})

export interface IBanGroupMemberQuickOpts {
  /**
   * quick ban with use `data.banTo`
   */
  to?: IBanMemberTo
}

export interface IBanGroupMemberOpts extends IBanGroupMemberQuickOpts {
  /**
   * manual ban, should use `groupId` and `userId`
   */
  groupId?: number
  userId?: number
  /**
   * bot account
   */
  qq?: number
  /**
   * ban seconds, (60s ~ 30days, 86400s)
   */
  BanTime: number
}

export const kickGroupMemberSchema = z.object({
  Uin: z.number(),
  Uid: z.string(),
})

export interface IKickGroupMemberQuickOpts {
  /**
   * quick kick with use `data.kickTo`
   */
  to?: IKickMemberTo
}

export interface IKickGroupMemberOpts extends IKickGroupMemberQuickOpts {
  /**
   * manual ban, should use `groupId` and `userId`
   */
  groupId?: number
  userId?: number
  /**
   * bot account
   */
  qq?: number
}

export interface IModifyGroupMemberNicknameOpts {
  groupId: number
  userId: number
  /**
   * 传递空字符串清空群昵称
   */
  newNickname: string
  /**
   * bot account
   */
  qq?: number
}

export interface IPatpatGroupMemberOpts {
  groupId: number
  userId: number
  /**
   * bot account
   */
  qq?: number
  /**
   * what is this ?
   */
  // NewTitle?: string
}

export interface IGroupListOpts {
  qq?: number
  /**
   * not use cache when `true`
   * @default false
   */
  force?: boolean
}

export interface IGetGroupMemberListOpts {
  groupId: number
  qq?: number
  /**
   * not use cache when `true`
   * @default false
   */
  force?: boolean
}

export const __unstable__use_dynamic_account =
  !!process.env.MAHIRO_DYNAMIC_ACCOUNT?.length

export const getImageUploadRetry = () => {
  const env = process.env.MAHIRO_IMAGE_UPLOAD_RETRY_TIME
  if (env) {
    return parseInt(env, 10)
  }
  return 500
}

export interface IGetImageSizeOpts {
  url?: string
  base64?: string
  filepath?: string
}

export interface IImageSize {
  width: number
  height: number
}
