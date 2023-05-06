import { consola } from 'consola'
import type { Mahiro } from '.'
import {
  IApiMsg,
  IRailOpts,
  IReplyGroupMessageOpts,
  replyToSchema,
} from './interface'
import { isNil } from 'lodash'
import {
  EToType,
  EUploadCommandId,
  IResponseDataWithImage,
  ISendMsgResponse,
} from '../send/interface'

export class Rail {
  mahiro!: Mahiro
  logger = consola.withTag('rail') as typeof consola

  constructor(opts: IRailOpts) {
    this.mahiro = opts.mahiro
  }

  /**
   * @deprecated Currently OPQ not implement this API
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
    this.logger.info(
      `Send reply message, use account ${qq}, msg content: ${msg?.Content?.slice(
        0,
        10,
      )}...`,
    )
    // ensure msg content is string
    if (isNil(msg?.Content)) {
      msg.Content = ''
    }
    const useQQ = this.mahiro.getUseQQ({
      specifiedQQ: qq,
    })
    if (fastImage?.length) {
      const res = (await this.mahiro.uploadFile({
        file: fastImage,
        commandId: EUploadCommandId.groupImage,
        qq: useQQ,
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
}
