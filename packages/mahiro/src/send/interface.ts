export enum ESendCmd {
  send = 'MessageSvc.PbSendMsg',
}

export interface ISendMsg {
  CgiCmd: ESendCmd
  CgiRequest: ICgiRequest
}

export enum EToType {
  private = 3,
  group = 2,
  friends = 1,
}

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
}

export enum IAt {
  /**
   * at 全体
   */
  all = 0,
}

export interface IAtUinList {
  QQUid: number | IAt
}

export interface ISendImage {
  FileId: number
  FileMd5: string
  FileSize: number
}

export interface ICgiBaseResponse {
  Ret: 0
  ErrMsg: string | ''
}

export interface IResponseData {
  MsgTime: number
}

export interface ISendMsgResponse {
  CgiBaseResponse: ICgiBaseResponse
  ResponseData: IResponseData
  Data: null
}

export enum EFuncName {
  MagicCgiCmd = 'MagicCgiCmd'
}

export interface ISendParams {
  funcname: EFuncName
  timeout: number
  qq: number
}