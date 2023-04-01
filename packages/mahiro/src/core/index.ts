import {
  DEFAULT_PORT,
  IApiSendFriendMessage,
  IApiSendGroupMessage,
  ICallbacks,
  IFriendMessage,
  IGroupMessage,
  IMahiroInitWithSimple,
  IMahiroInitWithWs,
  IMahiroOpts,
  IOnFriendMessage,
  IOnGroupMessage,
  CancelListener,
  IMahiroAdvancedOptions,
  DEFAULT_ADANCED_OPTIONS,
} from './interface'
import { z } from 'zod'
import { consola } from 'consola'
import WebSocket from 'ws'
import axios from 'axios'
import {
  EFuncName,
  ESendCmd,
  ISendParams,
  ISendMsg,
  ISendMsgResponse,
  EToType,
} from '../send/interface'
import qs from 'qs'
import { parse } from 'url'
import {
  EC2cCmd,
  EFromType,
  EMsgEvent,
  EMsgType,
  IMsg,
} from '../received/interface'
import chalk from 'mahiro/compiled/chalk'
import figlet from 'figlet'

export class Mahiro {
  ws!: string
  url!: string
  qq!: number
  logger = consola

  advancedOptions!: Required<IMahiroAdvancedOptions>

  callback: ICallbacks = {
    onGroupMessage: [],
    onFreindMessage: [],
  }

  constructor(opts: IMahiroOpts) {
    this.printLogo()
    this.checkInitOpts(opts)
    this.initUrl()
    this.connect()
  }

  private printLogo() {
    const fonts = figlet.fontsSync()
    const font = fonts.includes('Isometric3') ? 'Isometric3' : 'Ghost'
    const text = figlet.textSync('Mahiro', {
      font,
    })
    console.log(chalk.cyan(text))
    console.log()
  }

  private initUrl() {
    const parsed = parse(this.ws)
    this.url = `http://${parsed.hostname}:${parsed.port}`
  }

  private checkInitOpts(opts: IMahiroOpts) {
    const sharedSchema = {
      qq: z.number(),
      advancedOptions: z
        .object({
          ignoreMyself: z
            .boolean()
            .default(DEFAULT_ADANCED_OPTIONS.ignoreMyself),
        })
        .default(DEFAULT_ADANCED_OPTIONS),
    }
    const schema = z.union([
      z.object({
        host: z.string(),
        port: z.number().default(DEFAULT_PORT),
        ...sharedSchema,
      }),
      z.object({
        ws: z.string().startsWith('ws://'),
        ...sharedSchema,
      }),
    ])

    const result = schema.parse(opts)
    // qq
    this.qq = result.qq
    // advancedOptions
    this.advancedOptions =
      result.advancedOptions as Required<IMahiroAdvancedOptions>
    this.logger.debug('Advanced options: ', this.advancedOptions)

    // ws
    const withWs = result as IMahiroInitWithWs
    if (withWs?.ws?.length) {
      this.ws = withWs.ws
      return
    }
    const withSimple = result as IMahiroInitWithSimple
    if (withSimple?.host?.length && withSimple?.port) {
      this.ws = `ws://${withSimple.host}:${withSimple.port}/ws`
      return
    }

    throw new Error('Invalid opts')
  }

  private connect() {
    this.logger.info('Try connect...')
    let ws: WebSocket | null = new WebSocket(this.ws)

    const retryConnect = (time: number = 3 * 1e3) => {
      if (ws) {
        ws.close()
        ws = null
      }
      this.logger.warn('Retry connect..., wait ', time, 'ms')
      setTimeout(() => {
        this.connect()
      }, time)
    }
    if (!ws) {
      return
    }

    ws.on('error', (err) => {
      this.logger.error(`WS Error: `, err)
      retryConnect()
    })

    ws.on('open', () => {
      this.logger.success('WS Connected', this.ws)
    })

    ws.on('message', (data: Buffer) => {
      const str = data.toString()
      this.logger.debug('WS Message: ', str)
      try {
        const json = JSON.parse(str)
        this.triggerListener(json)
      } catch (e) {
        this.logger.error('WS message parse error: ', e)
      }
    })

    ws.on('close', () => {
      this.logger.warn('WS Closed')
      retryConnect()
    })
  }

  private triggerListener(json: IMsg) {
    const { CurrentPacket, CurrentQQ } = json
    if (CurrentQQ !== this.qq) {
      this.logger.error('CurrentQQ not match: ', CurrentQQ)
      return
    }
    const { EventData, EventName } = CurrentPacket
    if (EventName !== EMsgEvent.ON_EVENT_QQNT_NEW_MSG) {
      this.logger.error('Unsupport event name: ', EventName)
      return
    }
    const { MsgHead, MsgBody } = EventData

    // debug log
    this.logger.debug(
      'Received message: ',
      `FromType: ${MsgHead?.FromType}`,
      `MsgType: ${MsgHead?.MsgType}`,
      `C2cCmd: ${MsgHead?.C2cCmd}`,
      `Content: ${MsgBody?.Content || ''}`
    )

    const { ignoreMyself } = this.advancedOptions

    // onGroupMessage
    const isGroupMsg =
      MsgHead?.FromType === EFromType.group &&
      MsgHead?.MsgType === EMsgType.group &&
      MsgHead?.C2cCmd === EC2cCmd.group
    if (isGroupMsg) {
      const data = {
        groupId: MsgHead?.GroupInfo?.GroupCode!,
        groupName: MsgHead?.GroupInfo?.GroupName!,
        userId: MsgHead?.SenderUin,
        userNickname: MsgHead?.SenderNick || '',
        msg: MsgBody!,
      } satisfies IGroupMessage
      // ignore myself
      if (ignoreMyself && data.userId === this.qq) {
        return
      }
      // trigger callback
      this.logger.info(
        `Received ${chalk.green('group')} message: `,
        `${data?.groupName}(${data?.groupId})`,
        `${data?.userNickname}(${data?.userId})`
      )
      this.callback.onGroupMessage.forEach((callback) => {
        callback(data, json)
      })
      return
    }

    // onFriendMessage
    const isFriendMsg =
      MsgHead?.FromType === EFromType.friends &&
      MsgHead?.MsgType === EMsgType.friends &&
      MsgHead?.C2cCmd === EC2cCmd.firends
    if (isFriendMsg) {
      const data = {
        userId: MsgHead?.SenderUin,
        userName: MsgHead?.SenderNick || '',
        msg: MsgBody!,
      } satisfies IFriendMessage
      // ignore myself
      if (ignoreMyself && data.userId === this.qq) {
        return
      }
      // trigger callback
      this.logger.info(
        `Received ${chalk.blue('friend')} message: `,
        `${data?.userName}(${data?.userId})`
      )
      this.callback.onFreindMessage.forEach((callback) => {
        callback(data, json)
      })
      return
    }
  }

  private async sendApi(opts: {
    CgiRequest: ISendMsg['CgiRequest']
  }): Promise<ISendMsgResponse | undefined> {
    const { CgiRequest } = opts
    const params = {
      funcname: EFuncName.MagicCgiCmd,
      timeout: 10,
      qq: this.qq,
    } satisfies ISendParams
    const stringifyParams = qs.stringify(params)
    const sendMsgUrl = `${this.url}/v1/LuaApiCaller?${stringifyParams}`
    try {
      const res = await axios.post(sendMsgUrl, {
        CgiCmd: ESendCmd.send,
        CgiRequest,
      } satisfies ISendMsg)
      if (res?.data) {
        return res.data
      }
    } catch (e) {
      this.logger.error('Send api error: ', e)
    }
  }

  onGroupMessage(name: string, callback: IOnGroupMessage): CancelListener {
    this.logger.info(`Register ${chalk.green('onGroupMessage')}: `, name)
    this.callback.onGroupMessage.push(callback)
    return () => {
      this.callback.onGroupMessage.splice(
        this.callback.onGroupMessage.indexOf(callback),
        1
      )
    }
  }

  onFriendMessage(name: string, callback: IOnFriendMessage): CancelListener {
    this.logger.info(`Register ${chalk.blue('onFriendMessage')}: `, name)
    this.callback.onFreindMessage.push(callback)
    return () => {
      this.callback.onFreindMessage.splice(
        this.callback.onFreindMessage.indexOf(callback),
        1
      )
    }
  }

  async sendGroupMessage(data: IApiSendGroupMessage) {
    this.logger.info(
      `Send ${chalk.green('group')} message: ${data.groupId}, ${
        data?.msg?.Content?.slice(0, 10) || ''
      }...`
    )
    const res = await this.sendApi({
      CgiRequest: {
        ToUin: data.groupId,
        ToType: EToType.group,
        ...data.msg,
      },
    })
    return res
  }

  async sendFriendMessage(data: IApiSendFriendMessage) {
    this.logger.info(
      `Send ${chalk.blue('friend')} message: ${data.userId}, ${
        data?.msg?.Content?.slice(0, 10) || ''
      }`
    )
    const res = await this.sendApi({
      CgiRequest: {
        ToUin: data.userId,
        ToType: EToType.friends,
        ...data.msg,
      },
    })
    return res
  }
}
