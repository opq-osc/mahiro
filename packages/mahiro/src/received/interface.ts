export interface IMsg {
  /**
   * msg pack info
   */
  CurrentPacket: ICurrentPacket
  /**
   * bot qq
   */
  CurrentQQ: number
}

export enum EMsgEvent {
  /**
   * 初代版本的消息类型
   * @deprecated
   * @version v6.9.6-8827
   */
  ON_EVENT_QQNT_NEW_MSG = 'ON_EVENT_QQNT_NEW_MSG',
  /**
   * 好友消息 / 包括群里单人的操作（比如有人撤回），也是这个
   * @version v6.9.6
   */
  ON_EVENT_FRIEND_NEW_MSG = 'ON_EVENT_FRIEND_NEW_MSG',
  /**
   * 群消息
   * @version v6.9.6
   */
  ON_EVENT_GROUP_NEW_MSG = 'ON_EVENT_GROUP_NEW_MSG',
  /**
   * 有人加群了
   * @version v6.9.6
   */
  ON_EVENT_GROUP_JOIN = 'ON_EVENT_GROUP_JOIN',
  /**
   * 有人退群了
   * @version v6.9.6
   */
  ON_EVENT_GROUP_EXIT = 'ON_EVENT_GROUP_EXIT',
  /**
   * 被邀请入群了
   * @version v6.9.6
   */
  ON_EVENT_GROUP_INVITE = 'ON_EVENT_GROUP_INVITE',
  /**
   * 登录成功
   * @version v6.9.6
   */
  ON_EVENT_LOGIN_SUCCESS = 'ON_EVENT_LOGIN_SUCCESS',
  /**
   * 网络变化事件
   * @version v6.9.6
   */
  ON_EVENT_NETWORK_CHANGE = 'ON_EVENT_NETWORK_CHANGE',
  /**
   * 群组系统消息事件 (限是管理员)
   * @version v6.9.6
   */
  ON_EVENT_GROUP_SYSTEM_MSG_NOTIFY = 'ON_EVENT_GROUP_SYSTEM_MSG_NOTIFY',
}

/**
 * group manager events
 */
export const MSG_EVENT_GROUP_MANAGER: EMsgEvent[] = [
  EMsgEvent.ON_EVENT_GROUP_JOIN,
  EMsgEvent.ON_EVENT_GROUP_EXIT,
  EMsgEvent.ON_EVENT_GROUP_INVITE,
  EMsgEvent.ON_EVENT_GROUP_SYSTEM_MSG_NOTIFY,
]

export const VALID_MSG_EVENT: EMsgEvent[] = [
  EMsgEvent.ON_EVENT_FRIEND_NEW_MSG,
  EMsgEvent.ON_EVENT_GROUP_NEW_MSG,
  EMsgEvent.ON_EVENT_LOGIN_SUCCESS,
  EMsgEvent.ON_EVENT_NETWORK_CHANGE,
  ...MSG_EVENT_GROUP_MANAGER,
]

export interface ICurrentPacket<T extends IEventDataUnion = IEventData> {
  EventData: T
  EventName: EMsgEvent
}

/**
 * 进群事件
 */
export interface IEventWithJoin {
  /**
   * 处理人Uid
   * @desc Uin为数字QQ号 通过接口查询Uid to Uin
   */
  AdminUid: string
  /**
   * 进群者Uid
   */
  Uid: string
}

/**
 * 退群事件
 */
export interface IEventWithExit {
  /**
   * 退群者Uid
   */
  Uid: string
}

export type IEventUnion = IEventWithJoin | IEventWithExit | IEventWithInvite

/**
 * 邀请入群事件
 */
export interface IEventWithInvite {
  /**
   * 被邀请人Uin
   */
  Invitee: string
  /**
   * 邀请人Uin
   */
  Invitor: string
  /**
   *
   */
  Tips: string
}

/**
 * 仅限于登录成功事件
 */
export interface IEventDataWithLogin {
  /**
   * 昵称
   */
  Nick: string
  /**
   * 号码
   */
  Uin: number
  /**
   * 仅限于网络变化时才有
   * @example Will ReConnect After:xxx
   */
  Content?: string
}

export enum EMsgTypeWithGroupManager {
  /**
   * ? 申请进群
   * @fixme remove this
   */
  // apply = 1,
  /**
   * 申请进群
   * @admin
   */
  request = 6,
  /**
   * 被邀请进群
   * @member
   */
  invite = 2,
  /**
   * 退出群聊
   * @member
   * @admin
   */
  exit = 13,
  /**
   * 取消管理员
   * @admin
   */
  cancel_admin = 15,
  /**
   * 设置管理员
   * @admin
   */
  set_admin = 3,
  /**
   * 加入群聊
   * @member
   * @admin
   */
  join = 33
}

export enum EStatusWithGroupManager {
  /**
   * 无需处理，如：设置管理员
   */
  over = 0,
  /**
   * 未处理
   */
  unhandled = 1,
  /**
   * 已加入或待审核
   */
  joined_or_wait = 2,
  /**
   * 已拒绝
   */
  rejected = 3,
  /**
   * 忽略
   */
  ignored = 4,
}

/**
 * 仅限于群组系统消息事件
 */
export interface IEventDataWithGroupManager {
  /**
   * 操作人 Uid / 当前收通知的管理员 Uid (自己)
   */
  ActorUid: string
  /**
   * 操作人昵称 / 当前收通知的管理员昵称(自己)
   */
  ActorUidNick: string
  /**
   * 群号
   */
  GroupCode: number
  /**
   * 群名
   */
  GroupName: string
  /**
   * 邀请人 Uid
   */
  InvitorUid: string
  /**
   * 邀请人昵称
   */
  InvitorUidNick: string
  /**
   * 进群附加消息
   */
  MsgAdditional: string
  MsgSeq: number
  MsgType: EMsgTypeWithGroupManager
  /**
   * 被操作人 Uid
   */
  ReqUid: string
  /**
   * 被操作人昵称
   */
  ReqUidNick: string
  Status: EStatusWithGroupManager
}

export type IEventDataUnion =
  | IEventData
  | IEventDataWithLogin
  | IEventDataWithGroupManager

export interface IEventData<T extends IEventUnion = any> {
  /**
   * 消息头
   */
  MsgHead: IMsgHead
  /**
   * 消息体
   */
  MsgBody?: IMsgBody
  /**
   * 其他信息
   */
  Event?: T
}

export enum ESubMsgType {
  /**
   * 0为单一或复合类型消息(文字 At 图片 自由组合)
   */
  mixed = 0,
  xml = 12,
  video = 19,
  json = 51,

  /**
   * 上下线
   */
  online_offline = 528,
}

export type Url = `http://${string}`

export interface IImage {
  FileId: number
  FileMd5: string
  /**
   * 单位：字节
   */
  FileSize: number
  Url: Url
}

export interface IAtUinLists {
  /**
   * 群昵称
   * @version v6.9.6-0410
   */
  Nick: string | ''
  /**
   * qq 号
   * @version v6.9.6-0410
   */
  Uin: number
}

export interface IVoice {
  FileMd5: string
  FileSize: number
  /**
   * not raw url
   */
  Url: string
}

export interface IVideo {
  FileMd5: string
  FileSize: number
  /**
   * not raw url
   */
  Url: string
}

export interface IMsgBody {
  SubMsgType: ESubMsgType
  /**
   * 接受的内容 文字/XML/JSON
   *
   * @qq表情
   * 表情文本，如：[表情1]
   *
   * @emoji
   * emoji 会原样保留
   *
   * @at
   * 被 at 的部分文本会保留在这里面，如 @aaa @bbb
   *
   * @video
   * 你的QQ暂不支持查看视频短片，请期待后续版本
   */
  Content: string | ''
  /**
   * at 了谁
   */
  AtUinLists?: IAtUinLists[]
  /**
   * 图片
   */
  Images?: IImage[]
  /**
   * 视频
   */
  Video?: IVideo
  /**
   * 语音
   */
  Voice?: IVoice
}

export enum EFromType {
  /**
   * 好友
   */
  friends = 1,
  /**
   * 群组
   */
  group = 2,
  /**
   * 私聊
   */
  private = 3,
}

/**
 * @experimental 都不是很确定搭配，慎用
 */
export enum EMsgType {
  /**
   * 有人进群了
   */
  group_join = 33,
  /**
   * 有人退群了
   */
  group_exit = 34,
  /**
   * 收到消息
   */
  group = 82,
  /**
   * 收到好友私聊消息
   */
  friends = 166,
  /**
   * 自己的群名片被改了
   * ? 有人进群了
   */
  group_change = 528,
  /**
   * 1. 发出去消息的回应
   * 2. 有人撤回消息
   * 3. 自己被邀请入群
   * 4. 设置了不允许任何人加群
   */
  msg_sent = 732,

  // --- unknown ---

  // small_word_msg = 141,
  // qq_sports = 528

  // 被拉群了
  // old 1. fromType 2 + msgType 33 + c2c 0
  // old 2. from 2 + msg 87 + c2c 0

  // old 1. 群解散了 528 + 34
}

export interface IGroupInfo {
  /**
   * 群昵称
   */
  GroupCard: string
  /**
   * 群号
   */
  GroupCode: number
  GroupInfoSeq: number
  GroupLevel: number
  GroupRank: number
  GroupType: number
  /**
   * 群名
   */
  GroupName: string
}

/**
 * @experimental 都不是很确定搭配，慎用
 */
export enum EC2cCmd {
  /**
   * 收到群消息
   */
  group = 0,
  /**
   * 发出去消息的回应
   */
  msg_sent = 1,
  /**
   * 上线了
   * 有人进群了 MsgType 528 + c2c 8
   */
  online = 8,
  /**
   * 收到好友私聊了
   */
  firends = 11,
  /**
   * 设置了不允许任何人加群
   */
  group_cannot_join = 16,
  /**
   * 群消息被某人撤回了
   */
  msg_cancel = 17,
  /**
   * 自己被拉群了
   * 邀请人进群了 MsgType 732 + c2c 20
   */
  group_join = 20,
  /**
   * 自己的群名片被改了
   */
  group_card_changed = 39,
  /**
   * 上下线
   */
  online_offline = 349,
  /**
   * 群解散了
   */
  group_dismiss = 212,
  // 16 ?
  // 68 ? 有人进群了
}

export interface IMsgHead {
  /**
   * 消息来源  好友/私聊/群组Uid
   */
  FromUin: number
  /**
   * 接收消息对象 bot qq
   */
  ToUin: number
  /**
   * 消息来源类型
   */
  FromType: EFromType
  /**
   * 触发消息对象 Uid
   */
  SenderUin: number
  /**
   * 触发消息对象 群昵称 群组有值 私聊好友为空
   */
  SenderNick: string | ''
  /**
   * 消息类型 可根据此值自由过滤 慢慢摸索 总之有用
   */
  MsgType: EMsgType
  /**
   * C2c消息类型
   */
  C2cCmd: EC2cCmd
  MsgSeq: number
  /**
   * 10 位时间戳，单位秒
   */
  MsgTime: number
  MsgRandom: number
  MsgUid: number
  GroupInfo?: IGroupInfo
  C2CTempMessageHead?: IC2CtempMessageHead
}

export interface IC2CtempMessageHead {
  C2CType: number
  Sig: string
  GroupUin: number
  GroupCode: number
}
