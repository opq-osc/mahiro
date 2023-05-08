import { consola } from 'consola'
import {
  IBakaOpts,
  IDropGroupMessageOpts,
  IMessageSnapshotGetterOpts,
  ISendApiOpts,
  OPQ_APIS,
  dropSchema,
  getMessageSnapshotTTL,
} from './interface'
import type { Mahiro } from '.'
import {
  EFuncName,
  ESendCmd,
  ICgiRequestUnion,
  ICgiRequestWithDropMessage,
  ISendMsg,
  ISendMsgResponse,
  ISendParams,
} from '../send/interface'
import qs from 'qs'
import { IMsg } from '../received/interface'
import { isNil } from 'lodash'

export class Baka {
  logger = consola.withTag('baka') as typeof consola

  mahiro!: Mahiro

  // snapshot
  snapshotKey = 'mahiro:baka:snapshot:group'
  snapshotTTL = getMessageSnapshotTTL()

  constructor(opts: IBakaOpts) {
    this.mahiro = opts.mahiro
  }

  /**
   * simple send api, without interceptor, push stack, without message
   */
  async sendBakaApi<T extends ICgiRequestUnion, K extends ESendCmd>(
    opts: ISendApiOpts<T, K>,
  ) {
    const { CgiRequest, CgiCmd = ESendCmd.send, qq } = opts
    const account = this.mahiro.getAccount(qq)
    if (!account.wsConnected) {
      this.logger.error(`WS not connected, send api failed, account(${qq})`)
      return
    }
    const params = {
      funcname: EFuncName.MagicCgiCmd,
      timeout: 10,
      qq,
    } satisfies ISendParams
    const stringifyParams = qs.stringify(params)
    const sendMsgUrl = `${account.url}${OPQ_APIS.common}?${stringifyParams}`
    const data: ISendMsg<typeof CgiCmd, typeof CgiRequest> = {
      CgiCmd,
      CgiRequest,
    }
    try {
      const res = await account.request.post(sendMsgUrl, data)
      if (res?.data) {
        return res.data as ISendMsgResponse
      }
    } catch (e) {
      this.logger.error(`Send api error, account(${qq}) : `, e)
    }
  }

  async dropGroupMessage(data: IDropGroupMessageOpts) {
    const { to, qq } = data
    // validate
    this.logger.debug(`Drop group message, to: ${JSON.stringify(to)}`)
    try {
      dropSchema.parse(to)
    } catch (e) {
      this.logger.error(`Validate to failed, error:`, e)
      return
    }
    this.logger.info(
      `Drop group message, use account ${qq}, groupId: ${to.FromUin}`,
    )
    const useQQ = this.mahiro.getUseQQ({
      specifiedQQ: qq,
    })
    const { FromUin, MsgSeq, MsgRandom } = to
    const res = await this.sendBakaApi<
      ICgiRequestWithDropMessage,
      ESendCmd.drop_group_message
    >({
      CgiRequest: {
        Uin: FromUin,
        MsgSeq,
        MsgRandom,
      },
      CgiCmd: ESendCmd.drop_group_message,
      qq: useQQ,
    })
    return res
  }

  async setMessageSnapshot(json: IMsg) {
    if (!this.mahiro.db.isRedisKVAvailable) {
      return
    }
    const MsgHead = json?.CurrentPacket?.EventData?.MsgHead
    if (isNil(MsgHead?.FromUin) || isNil(MsgHead?.MsgSeq) || isNil(MsgHead?.MsgTime)) {
      this.logger.debug(`Message snapshot failed, because missing some fields, MsgHead: ${JSON.stringify(MsgHead)}`)
      return
    }
    const key = `${this.snapshotKey}:${MsgHead.FromUin}:${MsgHead.MsgSeq}:${MsgHead.MsgTime}`
    const value = JSON.stringify(json)
    await this.mahiro.db.redisKV.set(key, value, this.snapshotTTL)
    this.logger.debug(`Message snapshot success, key: ${key}`)
  }

  async getMessageSnapshotByHead(opts: IMessageSnapshotGetterOpts) {
    const { FromUin, MsgSeq, MsgTime } = opts
    if (isNil(FromUin) || isNil(MsgSeq) || isNil(MsgTime)) {
      this.logger.warn(`Get message snapshot failed, because missing some fields, opts: ${JSON.stringify(opts)}`)
      return
    }
    const key = `${this.snapshotKey}:${FromUin}:${MsgSeq}:${MsgTime}`
    const value = await this.mahiro.db.redisKV.get(key)
    if (isNil(value)) {
      this.logger.warn(`Get message snapshot failed, key: ${key}, expired or not exists`)
      return
    }
    const json = JSON.parse(value)
    this.logger.debug(`Get message snapshot success, key: ${key}`)
    return json as IMsg
  }
}
