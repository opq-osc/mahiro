import { consola } from 'consola'
import type { Mahiro } from '.'
import {
  EMahiroUploadFileType,
  IApiMsg,
  IApiSendGroupJsonMessage,
  IApiSendGroupXmlMessage,
  IRailOpts,
  IReplyGroupMessageOpts,
  replyToSchema,
} from './interface'
import { isNil, isString } from 'lodash'
import {
  EToType,
  EUploadCommandId,
  IResponseDataWithImage,
  ISendMsgResponse,
} from '../send/interface'
import { ESubMsgType } from '../received/interface'

export class Rail {
  mahiro!: Mahiro
  logger = consola.withTag('rail') as typeof consola

  constructor(opts: IRailOpts) {
    this.mahiro = opts.mahiro
  }

  /**
   * @deprecated 😭 Very dangerous, use it carefully
   * @description Currently cannot display the reply details (user name and message content)
   */
  async replyGroupMessage(data: IReplyGroupMessageOpts) {
    const {
      to,
      qq,
      msg = {
        Content: '',
      },
      fastImage,
    } = data
    // validate
    this.logger.debug(`Reply to: ${JSON.stringify(to)}`)
    try {
      replyToSchema.parse(to)
    } catch (e) {
      this.logger.error(`Reply Message 'to' object validate failed`, e)
      return
    }
    // ensure msg content is string
    if (isNil(msg?.Content)) {
      msg.Content = ''
    }
    const useQQ = this.mahiro.getUseQQ({
      specifiedQQ: qq,
    })
    this.logger.info(
      `Send reply message, use account ${useQQ}, msg content: ${msg?.Content?.slice(
        0,
        10,
      )}...`,
    )
    if (fastImage?.length) {
      const res = (await this.mahiro.uploadFile({
        file: fastImage,
        commandId: EUploadCommandId.groupImage,
        qq: useQQ,
        type: EMahiroUploadFileType.image
      })) as ISendMsgResponse<IResponseDataWithImage> | undefined
      const fileInfo = res?.ResponseData
      if (!fileInfo?.FileMd5?.length) {
        this.logger.error('[FastImage] Upload file failed, not get fileMd5')
        return
      } else {
        this.logger.success('[FastImage] Upload file success (Group)')
      }
      // add to msg
      msg.Images = [...(msg.Images || []), fileInfo]
    }
    const { FromUin, ...ReplyTo } = to
    const res = await this.mahiro.sendApi({
      CgiRequest: {
        ToUin: FromUin,
        ToType: EToType.group,
        ReplyTo,
        ...(msg as IApiMsg),
      },
      qq: useQQ,
    })
    return res
  }

  /**
   * @deprecated 😭 Very very dangerous, use it carefully
   */
  async sendGroupJsonMessage(data: IApiSendGroupJsonMessage) {
    const { groupId, qq, json } = data
    if (isNil(json)) {
      this.logger.error(`Send json message failed, json is empty`)
      return
    }
    const jsonStr = isString(json) ? json : JSON.stringify(json)
    this.logger.debug(`Json message string: ${jsonStr.slice(0, 100)}`)
    const useQQ = this.mahiro.getUseQQ({
      specifiedQQ: qq,
    })
    this.logger.info(
      `Send group json message to: ${groupId}, use account ${useQQ}, json content: ${jsonStr.slice(
        0,
        10,
      )}...`,
    )
    const res = await this.mahiro.sendApi({
      CgiRequest: {
        ToUin: groupId,
        ToType: EToType.group,
        SubMsgType: ESubMsgType.json,
        Content: jsonStr,
      },
      qq: useQQ,
    })
    return res
  }

  /**
   * @deprecated 😭 1. Very very dangerous, use it carefully
   *             ⛔️ 2. Currently OPQ not implement this API
   */
  async sendGroupXMLMessage(data: IApiSendGroupXmlMessage) {
    const { groupId, qq, xml } = data
    if (isNil(xml)) {
      this.logger.error(`Send xml message failed, json is empty`)
      return
    }
    if (!isString(xml) || !xml?.length) {
      this.logger.error(`Send xml message failed, xml is not string or empty`)
      return
    }
    this.logger.debug(`Xml message string: ${xml.slice(0, 100)}`)
    this.logger.info(
      `Send group xml message to: ${groupId}, use account ${qq}, xml content: ${xml.slice(
        0,
        10,
      )}...`,
    )
    const useQQ = this.mahiro.getUseQQ({
      specifiedQQ: qq,
    })
    const res = await this.mahiro.sendApi({
      CgiRequest: {
        ToUin: groupId,
        ToType: EToType.group,
        SubMsgType: ESubMsgType.xml,
        Content: xml,
      },
      qq: useQQ,
    })
    return res
  }
}
