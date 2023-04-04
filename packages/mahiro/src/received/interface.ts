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
  ON_EVENT_QQNT_NEW_MSG = 'ON_EVENT_QQNT_NEW_MSG',
}

export interface ICurrentPacket {
  EventData: IEventData
  EventName: EMsgEvent
}

export interface IEventData {
  /**
   * 消息头
   */
  MsgHead: IMsgHead
  /**
   * 消息体
   */
  MsgBody?: IMsgBody
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
  FileSize: number
  Url: Url
}

export interface IAtUinLists {
  /**
   * 群昵称
   */
  QQNick: string
  /**
   * qq 号
   */
  QQUid: number
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

export enum EMsgType {
  // small_word_msg = 141,
  // qq_sports = 528
  /**
   * 收到消息
   */
  group = 82,
  /**
   * 发出去消息的回应
   */
  msg_sent = 732,
  /**
   * 收到好友私聊消息
   */
  friends = 166,

  // 被拉群了
  // 1. fromType 2 + msgType 33 + c2c 0
  // 2. from 2 + msg 87 + c2c 0

  // 群解散了 528 + 34
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
   * 群消息被撤回了
   */
  msg_cancel = 17,
  /**
   * 上下线
   */
  online_offline = 349,
  /**
   * 被拉群了
   */
  group_join = 20,
  /**
   * 群解散了
   */
  group_dismiss = 212,
  /**
   * 上线了
   */
  online = 8,
  /**
   * 收到好友私聊了
   */
  firends = 11,

  // 16 ?
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
