import { ESubMsgType, IMsgHead } from '../received/interface'

export enum ESendCmd {
  send = 'MessageSvc.PbSendMsg',
  upload = 'PicUp.DataUp',
  search = 'QueryUinByUid',
  get_group_list = 'GetGroupLists',
}

export interface ISearchUserRequest {
  Uid: string
}

export interface ISearchUser {
  CgiCmd: ESendCmd.search
  CgiRequest: ISearchUserRequest
}

export interface IGetUserListRequest {
  Uin: number
  LastBuffer: string
}

export interface IGetUserList {
  CgiCmd: ESendCmd.get_group_list
  CgiRequest: IGetUserListRequest | {}
}

export interface IUploadFile {
  CgiCmd: ESendCmd.upload
  CgiRequest: IUploadFileRequest
}

export enum EUploadCommandId {
  /**
   * 好友图片
   */
  friendImage = 1,
  /**
   * 群组图片
   */
  groupImage = 2,
  /**
   * 好友语音
   */
  friendVoice = 26,
  /**
   * 群组语音
   */
  groupVoice = 29,
}

export interface IUploadFileRequest {
  CommandId: EUploadCommandId
  /**
   * 文件本地路径
   * FilePath, FileUrl不能同时存在
   */
  FilePath?: string
  /**
   * 文件网络路径
   */
  FileUrl?: string
  /**
   * 文件Base64
   * @version v6.9.6-0410
   */
  Base64Buf?: string
}

export interface ISendMsg {
  CgiCmd: ESendCmd.send
  CgiRequest: ICgiRequest
}

export enum EToType {
  private = 3,
  group = 2,
  friends = 1,
}

export type IReplyTo = Required<
  Pick<IMsgHead, 'MsgSeq' | 'MsgType' | 'MsgUid' | 'FromUin'>
>

export interface ICgiRequest {
  /**
   * 发送消息对象 好友/私聊/群组Uid
   */
  ToUin: number
  /**
   * 发送消息对象类型 3私聊 2群组 1好友
   */
  ToType: EToType
  /**
   * 发送消息内容 长文本未测试
   */
  Content: string | ''
  /**
   * AtUser数组
   */
  AtUinLists?: IAtUinList[]
  /**
   * 图片数组
   */
  Images?: ISendImage[]
  // todo: support voice

  /**
   * only for reply group message
   * @scope Reply group message
   */
  ReplyTo?: Omit<IReplyTo, 'FromUin'>

  /**
   * only for send json/xml message
   * @scope Send json/xml message
   */
  SubMsgType?: ESubMsgType
}

export enum IAt {
  /**
   * at 全体
   */
  all = 0,
}

export interface IAtUinList {
  /**
   * 可以为空 但是PC客户端显示不正常手机端正常
   * @version v6.9.6-0410
   */
  Nick: string | ''
  /**
   * 号码
   * @version v6.9.6-0410
   */
  Uin: number | IAt
}

export interface ISendImage {
  FileId: number
  FileMd5: string
  FileSize: number
}

export enum ECgiBaseRes {
  success = 0,
}

export interface ICgiBaseResponse {
  Ret: ECgiBaseRes
  ErrMsg: string | ''
}

/**
 * 消息发送的响应
 */
export interface IResponseData {
  MsgTime: number
}

/**
 * 发送语音消息的响应
 */
export interface IResponseDataWithVoice {
  FileMd5: string
  FileSize: number
  FileToken: string
}

/**
 * 发送图片消息的响应
 */
export interface IResponseDataWithImage {
  FileId: number
  FileMd5: string
  FileSize: number
}

export type AvatarUrl = `http://q.qlogo.cn/g?b=qq&k=${string}&kti=${string}&s=`

export enum EAvatarSize {
  s_40 = 1, // 2, 40
  s_100 = 3, // 100
  s_140 = 4,
  s_640 = 5,
}

export interface IGroupList {
  /**
   * timestamp (s)
   */
  CreateTime: number
  /**
   * group member max
   */
  GroupCnt: number
  /**
   * group id
   */
  GroupCode: number
  GroupName: string
  /**
   * current group member count
   */
  MemberCnt: number
}

export interface IResponseDataWithGroupList {
  GroupLists: IGroupList[]
}

/**
 * 根据 Uid 差 Uin 信息响应
 */
export interface IResponseDataWithSearchUser {
  /**
   * account id
   */
  Uin: number
  /**
   * string id
   */
  Uid: string
  /**
   * account nickname
   */
  Nick: string
  /**
   * avatar url
   */
  Head: AvatarUrl
  Signature: ''
  /**
   * 完整的还没试过
   */
  Sex: number | 255 | 2
  Level: number
  /**
   * account note name, only is friend
   */
  Mark: string | ''
}

export type IResponseDataUnion =
  | IResponseData
  | IResponseDataWithVoice
  | IResponseDataWithImage
  | IResponseDataWithSearchUser
  | IResponseDataWithGroupList

export interface ISendMsgResponse<
  T extends IResponseDataUnion = IResponseData,
> {
  CgiBaseResponse: ICgiBaseResponse
  ResponseData: T
  Data: null
}

export interface ILoginResponseData {
  BQrsig: string
  QrUrl: string
  BQrpic: string
  BQBase64rpic: string
  ScanStatus: number
  ScanDwUin: number
  DwExpireTime: number
  DwQueryTime: number
}

// /v1/login/getqrcode?json=1
export interface ILoginResponse {
  CgiBaseResponse: ICgiBaseResponse
  ResponseData: ILoginResponseData
  Data: null
}

export enum EFuncName {
  MagicCgiCmd = 'MagicCgiCmd',
}

export interface ISendParams {
  funcname: EFuncName
  timeout: number
  qq: number
}
