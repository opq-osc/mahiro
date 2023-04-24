import {
  IApiSendFriendMessage,
  IApiSendGroupMessage,
  ICallbacks,
  IFriendMessage,
  IGroupMessage,
  IMahiroOpts,
  IOnFriendMessage,
  IOnGroupMessage,
  CancelListener,
  IMahiroAdvancedOptions,
  DEFAULT_ADANCED_OPTIONS,
  DEFAULT_NETWORK,
  INodeServerOpts,
  DEFAULT_NODE_SERVER,
  SERVER_ROUTES,
  apiSchema,
  IMahiroInterceptorContext,
  IMahiroInterceptorFunction,
  IMahiroUploadFileOpts,
  IApiMsg,
  asyncHookUtils,
  EAsyncContextFrom,
  ISendApiOpts,
  IMahiroInterceptor,
  IMahiroUse,
  IMahiroGroupMiddleware,
  IMiddlewares,
  IMahiroFriendMiddleware,
  IMahiroMiddleware,
  EMiddleware,
  IAccont,
  __UNSTABLE_PYTHON_SERVER_BASE,
  PYTHON_SERVER_APIS,
  ISendToPythonData,
  IPythonHealthResponse,
  IOnNativeEvent,
  IMahiroNativeMiddleware,
  IOnGroupEvent,
  IGroupEvent,
  OPQ_APIS,
  ISearchUserOpts,
  IGroupEventExit,
  IAsyncContextInfo,
  IGroupEventJoin,
  IGroupEventInvite,
  IGroupEventAdminChange,
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
  IUploadFile,
  EUploadCommandId,
  ECgiBaseRes,
  ISearchUser,
  IResponseDataWithSearchUser,
  IResponseDataWithImage,
} from '../send/interface'
import qs from 'qs'
import { parse } from 'url'
import {
  EC2cCmd,
  EFromType,
  EMsgEvent,
  EMsgType,
  EMsgTypeWithGroupManager,
  IEventDataWithGroupManager,
  IEventWithExit,
  IEventWithJoin,
  IMsg,
  MSG_EVENT_GROUP_MANAGER,
  VALID_MSG_EVENT,
} from '../received/interface'
import chalk from 'mahiro/compiled/chalk'
import figlet from 'figlet'
import express from 'express'
import cors from 'cors'
import { removeNull } from '../utils/removeNull'
import { Database } from '../database'
import { AsyncLocalStorage } from 'async_hooks'
import { existsSync } from 'fs'
import { dirname, isAbsolute, join } from 'path'
import serveStatic from 'serve-static'
import { cloneDeep, isFunction, isNil, isString, trim } from 'lodash'
import { detectFileType, getFileBase64 } from '../utils/file'
import { CronJob } from './cron'
import { Utils } from './utils'
import { getMahiroConfigs } from '../utils/mahiroConfigs'
import { Session } from './session'
import bodyParser from 'body-parser'

export class Mahiro {
  opts!: IMahiroOpts

  // accounts
  mainAccount!: IAccont
  sideAccounts!: IAccont[]

  // logger
  logger = consola
  loggerWithInterceptor = consola.withTag('interceptor') as typeof consola

  // more options
  advancedOptions!: Required<IMahiroAdvancedOptions>

  // node server
  app!: express.Express
  nodeServer!: Required<INodeServerOpts>
  pythonServerUrl!: string
  pythonServerChecker!: NodeJS.Timeout
  pythonServerRetryCount = 0

  // listeners
  callback: ICallbacks = {
    onGroupMessage: {},
    onFreindMessage: {},
    onNativeEvent: {},
    onGroupEvent: {},
  }

  // middlewares
  middlewares: IMiddlewares = {
    group: [],
    friend: [],
    native: [],
  }

  // db
  db!: Database

  // status
  initialled = false

  // async context
  asyncLocalStorage = new AsyncLocalStorage()

  // msg stack global config
  msgStackConfig = {
    timeout: 3 * 60 * 1e3,
    max: 10,
  }

  // cron
  cron = new CronJob()

  // utils
  utils = new Utils()

  // other configs
  otherConfigs = getMahiroConfigs()

  // session
  session!: Session

  constructor(opts: IMahiroOpts) {
    this.printLogo()
    this.opts = opts
  }

  async run() {
    this.logger.info('Mahiro is starting...')
    await this.checkOptsAndConnect()
    await this.connectDatabase()
    this.initSession()
    await this.startNodeServer()
    this.registerOptionsInterceptors()
    this.registerAdminManager()
    this.logger.success('Mahiro started')
    this.initialled = true
  }

  private initSession() {
    this.session = new Session({
      mahiro: this,
    })
  }

  static async start(opts: IMahiroOpts) {
    const ins = new Mahiro(opts)
    await ins.run()
    return ins
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

  private getInitUrl(opts: { ws: string }) {
    const { ws } = opts
    const parsed = parse(ws)
    // check local
    const isLocal = ['localhost', '127.0.0.1', '0.0.0.0'].includes(
      parsed.hostname || '',
    )
    this.logger.debug('[Local] Is local: ', isLocal, ws)
    const url = `http://${parsed.hostname}:${parsed.port}`
    return {
      url,
      isLocal,
    }
  }

  private async checkOptsAndConnect() {
    const opts = this.opts
    // ensure qq number
    const mainAccountEnv = process.env.MAHIRO_ACCOUNT_MAIN
    if (!opts?.qq && !mainAccountEnv?.length) {
      throw new Error(
        `You must provide a 'qq' number or set env 'MAHIRO_ACCOUNT_MAIN'`,
      )
    }

    const sideQQschema = z.union([
      z.number(),
      z.union([
        z.object({
          qq: z.number(),
          host: z.string().default(DEFAULT_NETWORK.host),
          port: z.number().default(DEFAULT_NETWORK.port),
        }),
        z.object({
          qq: z.number(),
          ws: z.string().startsWith('ws://'),
        }),
      ]),
    ])
    const sharedSchema = {
      qq: z.number().default(Number(mainAccountEnv)),
      advancedOptions: z
        .object({
          ignoreMyself: z
            .boolean()
            .default(DEFAULT_ADANCED_OPTIONS.ignoreMyself),
          databasePath: z
            .string()
            .default(DEFAULT_ADANCED_OPTIONS.databasePath),
          interceptors: z
            .array(
              z.union([z.string(), z.custom((v) => typeof v === 'function')]),
            )
            .default(DEFAULT_ADANCED_OPTIONS.interceptors),
          sideQQs: z
            .array(sideQQschema)
            .default(DEFAULT_ADANCED_OPTIONS.sideQQs),
          redisKV: z.string().default(DEFAULT_ADANCED_OPTIONS.redisKV),
        })
        .default(DEFAULT_ADANCED_OPTIONS),
      nodeServer: z
        .object({
          port: z.number().default(DEFAULT_NODE_SERVER.port),
          pythonPort: z.number().default(DEFAULT_NODE_SERVER.pythonPort),
        })
        .default(DEFAULT_NODE_SERVER),
    }
    const schema = z.union([
      z.object({
        host: z.string().default(DEFAULT_NETWORK.host),
        port: z.number().default(DEFAULT_NETWORK.port),
        ...sharedSchema,
      }),
      z.object({
        ws: z.string().startsWith('ws://'),
        ...sharedSchema,
      }),
    ])

    const result = schema.parse(opts)

    // init main account
    // @ts-ignore
    const mainAccountWs = result?.ws?.length
      ? // @ts-ignore
        result.ws
      : // @ts-ignore
        `ws://${result.host}:${result.port}/ws`
    const { url: mainAccountUrl, isLocal: mainAccountIsLocal } =
      this.getInitUrl({ ws: mainAccountWs })
    const mainAccountQQ = result.qq
    const mainRequest = this.createRequest({
      qq: mainAccountQQ,
    })
    const mainAccount: IAccont = {
      ws: mainAccountWs,
      url: mainAccountUrl,
      qq: mainAccountQQ,
      request: mainRequest,
      wsConnected: false,
      wsRetrying: false,
      wsIns: null!,
      stack: new Map(),
      local: mainAccountIsLocal,
      side: false,
      external: false,
    }
    this.logger.debug(`[Main] ${JSON.stringify(mainAccount)}`)
    await this.createConnect(mainAccount)
    this.mainAccount = mainAccount

    // side accounts
    const sideAccounts: IAccont[] = []
    const sideQQs = result.advancedOptions.sideQQs || []
    for await (const item of sideQQs) {
      const isInternalSide = typeof item === 'number'
      const sideQQ = typeof item === 'number' ? item : item.qq
      const isRepeat =
        item === mainAccountQQ || sideAccounts.some((v) => v.qq == item)
      if (isRepeat) {
        throw new Error(`Side account ${sideQQ} is repeat! Please check it.`)
      }
      if (isInternalSide) {
        // repeat check
        sideAccounts.push({
          ...this.mainAccount,
          stack: new Map(),
          wsIns: null!,
          wsConnected: true,
          wsRetrying: false,
          qq: item,
        })
        this.logger.debug(`[Side(${item}]: reuse main account info`)
      } else {
        // @ts-ignore
        const sideWs = item?.ws ? item.ws : `ws://${item.host}:${item.port}/ws`
        const { url: sideUrl, isLocal: sideIsLocal } = this.getInitUrl({
          ws: sideWs,
        })
        const sideRequest = this.createRequest({
          qq: sideQQ,
        })
        const sideAccount: IAccont = {
          ws: sideWs,
          url: sideUrl,
          qq: sideQQ,
          request: sideRequest,
          wsConnected: false,
          wsRetrying: false,
          wsIns: null!,
          stack: new Map(),
          local: sideIsLocal,
          side: true,
          external: !isInternalSide,
        }
        this.logger.debug(`[Side(${sideQQ})] ${JSON.stringify(sideAccount)}`)
        await this.createConnect(sideAccount)
        sideAccounts.push(sideAccount)
      }
    }
    this.sideAccounts = sideAccounts

    // advancedOptions
    this.advancedOptions =
      result.advancedOptions as Required<IMahiroAdvancedOptions>
    this.logger.debug('Advanced options: ', this.advancedOptions)
    // nodeServer
    this.nodeServer = result.nodeServer as Required<INodeServerOpts>
    this.logger.debug('Node server options: ', this.nodeServer)
    // init python server url
    this.pythonServerUrl = `${__UNSTABLE_PYTHON_SERVER_BASE}:${this.nodeServer.pythonPort}`
    this.logger.debug('Python server url: ', this.pythonServerUrl)
  }

  private async createConnect(account: IAccont) {
    return new Promise<void>((resolve, _reject) => {
      const { ws } = account
      if (account.wsRetrying || account.wsConnected) {
        this.logger.debug(
          `WS status retrying: ${account.wsRetrying}, connected: ${account.wsConnected}, ${ws}`,
        )
        resolve()
        return
      }
      // create ws
      const wsIns = new WebSocket(ws)
      account.wsIns = wsIns
      this.logger.info(`Try connect, ${ws}`)

      const retryConnect = (time: number = 5 * 1e3) => {
        if (account.wsRetrying || account.wsConnected) {
          this.logger.debug(
            `Retry WS status retrying: ${account.wsRetrying}, connected: ${account.wsConnected}, ${ws}`,
          )
          return
        }
        this.logger.warn(`Retry connect..., wait ${time} ms, ${ws}`)
        account.wsRetrying = true
        setTimeout(() => {
          account.wsRetrying = false
          this.createConnect(account)
        }, time)
      }

      wsIns.on('error', (err) => {
        this.logger.error(`WS Error: ${err}, ${ws}`)
      })

      wsIns.on('open', () => {
        this.logger.success(`WS Connected: ${ws}`)
        account.wsConnected = true
        resolve()
      })

      wsIns.on('message', (data: Buffer) => {
        const str = data.toString()
        this.logger.debug(`WS Message: ${str}, ${ws}`)
        if (process.env.MAHIRO_ONLY_LOG_WS_MSG) {
          return
        }
        try {
          const json = JSON.parse(str)
          this.triggerListener(json)
        } catch (e) {
          this.logger.error('WS message parse error: ', e)
        }
      })

      wsIns.on('close', () => {
        this.logger.warn('WS Closed')
        account.wsConnected = false
        retryConnect()
      })

      // debug
      if (process.env.MAHIRO_IGNORE_CONNECT) {
        this.logger.debug('MAHIRO_IGNORE_CONNECT :: Ignore connect')
        resolve()
      }
    })
  }

  private isRegisteredAccount(qq: number) {
    return (
      qq === this.mainAccount.qq || this.sideAccounts.some((v) => v.qq === qq)
    )
  }

  private async triggerListener(_json: IMsg) {
    let json = cloneDeep(_json)
    const { CurrentPacket, CurrentQQ } = json
    const isValidQQ = this.isRegisteredAccount(CurrentQQ)
    if (!isValidQQ) {
      this.logger.error(
        'CurrentQQ not match: ',
        CurrentQQ,
        'if you want to use it, please add it to "advancedOptions.sideQQs"',
      )
      return
    }

    const { EventData, EventName } = CurrentPacket
    // valid event name
    const isSupportEvent = VALID_MSG_EVENT.includes(EventName)
    if (!isSupportEvent) {
      this.logger.warn(
        'Unsupport event name: ',
        chalk.yellow(EventName),
        'will ignore it',
      )
      return
    }

    // event name logger
    switch (EventName) {
      case EMsgEvent.ON_EVENT_LOGIN_SUCCESS:
        this.logger.success('Login success')
        break
      case EMsgEvent.ON_EVENT_NETWORK_CHANGE:
        this.logger.success('Network change')
        break
      // todo: more event name tips
    }

    const { MsgHead, MsgBody: _MsgBody } = EventData
    // remove msg body null value
    // because null can not match models in python
    const MsgBody = removeNull(_MsgBody)

    // debug log
    this.logger.debug(
      'Received message: ',
      `FromType: ${MsgHead?.FromType}`,
      `MsgType: ${MsgHead?.MsgType}`,
      `C2cCmd: ${MsgHead?.C2cCmd}`,
      `Content: ${MsgBody?.Content || ''}`,
    )

    // handle native phase
    const withContextForNativeEvent = this.createAsyncContext({
      qq: CurrentQQ,
      from: EAsyncContextFrom.native,
    })
    // call native middlewares
    const nativeMiddlewares = this.middlewares.native
    if (nativeMiddlewares.length) {
      await withContextForNativeEvent({
        name: EMiddleware.native,
        cb: async () => {
          const newData = await this.callMiddlewares({
            data: json,
            middlewares: this.middlewares.native,
          })
          json = newData
        },
      })
    }
    if (!json) {
      this.logger.warn('Native middleware return null, will ignore it')
      return
    }
    // onNativeEvent
    Object.entries(this.callback.onNativeEvent).forEach(([name, func]) => {
      withContextForNativeEvent({
        name,
        cb: async () => {
          await func(json)
        },
      })
    })

    // onGroupEvent
    const isGroupEvent = MSG_EVENT_GROUP_MANAGER.includes(EventName)
    if (isGroupEvent) {
      // async context
      const withContext = this.createAsyncContext({
        from: EAsyncContextFrom.group_event,
        qq: CurrentQQ,
      })
      // exit group
      let data: IGroupEvent | null = null
      // member can recived event
      if (EventName === EMsgEvent.ON_EVENT_GROUP_EXIT) {
        const Uid = (EventData?.Event as IEventWithExit)?.Uid
        if (!Uid) {
          this.logger.warn(`Exit group event ${EventName} not found Uid, skip`)
          return
        }
        data = {
          event: EMsgTypeWithGroupManager.exit,
          getUserInfo: this.createUserGetter({
            Uid,
            qq: CurrentQQ,
          }),
        } as IGroupEventExit
      }
      if (EventName === EMsgEvent.ON_EVENT_GROUP_JOIN) {
        const Uid = (EventData?.Event as IEventWithJoin)?.Uid
        const AdminUid = (EventData?.Event as IEventWithJoin)?.AdminUid
        if (!Uid || !AdminUid) {
          this.logger.warn(`Join group event ${EventName} not found Uid or AdminUid, skip`)
          return
        }
        data = {
          event: EMsgTypeWithGroupManager.join,
          getUserInfo: this.createUserGetter({
            Uid,
            qq: CurrentQQ,
          }),
          getAdminInfo: this.createUserGetter({
            Uid: AdminUid,
            qq: CurrentQQ,
          }),
        } as IGroupEventJoin
      }
      if (EventName === EMsgEvent.ON_EVENT_GROUP_INVITE) {
        // const Invitee = (EventData?.Event as IEventWithInvite)?.Invitee
        // const Invitor = (EventData?.Event as IEventWithInvite)?.Invitor
        // const Tips = (EventData?.Event as IEventWithInvite)?.Tips
        // ? FIXME: 目前好像就是收不到 EventData?.Event 里的任何内容
        // if (!Invitee || !Invitor || !Tips) {
        //   this.logger.warn(`Invite group event ${EventName} not found Invitee or Invitor or Tips, skip`)
        //   return
        // }
        data = {
          event: EMsgTypeWithGroupManager.invite,
          // tips: Tips,
          // getUserInfo: this.createUserGetter({
          //   Uid: Invitee,
          //   qq: CurrentQQ,
          // }),
          // getAdminInfo: this.createUserGetter({
          //   Uid: Invitor,
          //   qq: CurrentQQ,
          // }),
        } as IGroupEventInvite
      }
      // manager can recived event
      if (EventName === EMsgEvent.ON_EVENT_GROUP_SYSTEM_MSG_NOTIFY) {
        const eventData = EventData as any as IEventDataWithGroupManager
        const targetUid = eventData?.ReqUid
        const adminUid = eventData?.ActorUid
        if (!targetUid || !adminUid) {
          this.logger.warn(`Group system event ${EventName} not found ReqUid or ActorUid, skip`)
          return
        }
        data = {
          event: eventData.MsgType,
          targetNickName: eventData?.ReqUidNick,
          getTargetInfo: this.createUserGetter({
            Uid: targetUid,
            qq: CurrentQQ,
          }),
          adminNickName: eventData?.ActorUidNick,
          getAdminInfo: this.createUserGetter({
            Uid: adminUid,
            qq: CurrentQQ,
          }),
          groupId: eventData?.GroupCode,
          groupName: eventData?.GroupName,
        } as IGroupEventAdminChange
      }
      if (data) {
        // call callbacks
        Object.entries(this.callback.onGroupEvent).forEach(([name, plugin]) => {
          withContext({
            name,
            cb: () => {
              plugin.call(null, data!, json)
            },
          })
        })
      } else {
        throw new Error(`Never`)
      }
      return
    }

    const { ignoreMyself } = this.advancedOptions
    // onGroupMessage
    const isGroupMsg =
      MsgHead?.FromType === EFromType.group &&
      MsgHead?.MsgType === EMsgType.group &&
      MsgHead?.C2cCmd === EC2cCmd.group
    if (isGroupMsg) {
      let data = {
        groupId: MsgHead?.GroupInfo?.GroupCode!,
        groupName: MsgHead?.GroupInfo?.GroupName!,
        userId: MsgHead?.SenderUin,
        userNickname: MsgHead?.SenderNick || '',
        msg: MsgBody!,
        qq: CurrentQQ,
        configs: {
          availablePlugins: [],
        },
      } as IGroupMessage
      // ignore myself and all side qq
      const isBot = this.isRegisteredAccount(data.userId)
      if (ignoreMyself && isBot) {
        return
      }
      // trigger callback
      this.logger.info(
        `Received ${chalk.green('group')} message: `,
        `${data?.groupName}(${data?.groupId})`,
        `${data?.userNickname}(${data?.userId})`,
      )
      // async context
      const withContext = this.createAsyncContext({
        from: EAsyncContextFrom.group,
        qq: CurrentQQ,
      })
      // call middlewares
      const middlewares = this.middlewares.group
      if (middlewares.length) {
        await withContext({
          name: EMiddleware.group,
          cb: async () => {
            const newData = await this.callMiddlewares({
              data,
              middlewares: this.middlewares.group,
            })
            data = newData
          },
        })
      }
      if (!data) {
        return
      }
      // group expired
      const isValid = await this.db.isGroupValid({
        groupId: data.groupId,
        qq: CurrentQQ,
      })
      if (!isValid) {
        this.logger.debug(`Group(${data.groupId}) expired, ignore message`)
        return
      }
      // trigger callback
      const avaliablePlugins = await this.db.getAvailablePlugins({
        groupId: data.groupId,
        userId: data.userId,
      })
      this.logger.debug(
        `Group(${data.groupId}) + User(${data.userId}) avaliable plugins: `,
        avaliablePlugins,
      )
      if (!avaliablePlugins.length) {
        return
      }
      // add configs
      data.configs.availablePlugins = avaliablePlugins
      // call callbacks
      Object.entries(this.callback.onGroupMessage).forEach(([name, plugin]) => {
        const isAvaliable = avaliablePlugins.includes(name)
        if (!isAvaliable) {
          return
        }
        withContext({
          name,
          cb: async () => {
            const args = [data, json] as any
            const isFunc = isFunction(plugin)
            if (isFunc) {
              plugin.apply(null, args)
              return
            }
            const isSession = Array.isArray(plugin)
            if (isSession) {
              // botId-groupId-userId
              const sessionId = `${CurrentQQ}-${data.groupId}-${data.userId}`
              await this.session.callSession({
                id: sessionId,
                args,
                sessions: plugin,
              })
            }
          },
        })
      })
      return
    }

    // onFriendMessage
    const isFriendMsg =
      MsgHead?.FromType === EFromType.friends &&
      MsgHead?.MsgType === EMsgType.friends &&
      MsgHead?.C2cCmd === EC2cCmd.firends
    if (isFriendMsg) {
      let data = {
        userId: MsgHead?.SenderUin,
        userName: MsgHead?.SenderNick || '',
        msg: MsgBody!,
        qq: CurrentQQ,
      } satisfies IFriendMessage
      // ignore myself and all side qq
      const isBot = this.isRegisteredAccount(data.userId)
      if (ignoreMyself && isBot) {
        return
      }
      // trigger callback
      this.logger.info(
        `Received ${chalk.blue('friend')} message: `,
        `${data?.userName}(${data?.userId})`,
      )
      // async context
      const withContext = this.createAsyncContext({
        qq: CurrentQQ,
        from: EAsyncContextFrom.friend,
      })
      // call middlewares
      const middlewares = this.middlewares.friend
      if (middlewares.length) {
        await withContext({
          name: EMiddleware.friend,
          cb: async () => {
            const newData = await this.callMiddlewares({
              data,
              middlewares: this.middlewares.friend,
            })
            data = newData
          },
        })
      }
      if (!data) {
        return
      }
      // trigger callback
      Object.entries(this.callback.onFreindMessage).forEach(
        ([name, plugin]) => {
          withContext({
            name,
            // todo: extract this to a function
            cb: async () => {
              const args = [data, json] as any
              const isFunc = isFunction(plugin)
              if (isFunc) {
                plugin.apply(null, args)
                return
              }
              const isSession = Array.isArray(plugin)
              if (isSession) {
                // botId-userId
                const sessionId = `${CurrentQQ}-${data.userId}`
                await this.session.callSession({
                  id: sessionId,
                  args,
                  sessions: plugin,
                })
              }
            },
          })
        },
      )
      return
    }
  }

  private getAsyncContext() {
    return asyncHookUtils.parse(this.asyncLocalStorage.getStore())
  }

  private getAccount(qq: number) {
    if (qq === this.mainAccount.qq) {
      return this.mainAccount
    }
    return this.sideAccounts.find((account) => account.qq === qq)!
  }

  private getUseQQ(opts: { specifiedQQ?: number }) {
    const { specifiedQQ } = opts
    let useQQ = specifiedQQ
    if (!useQQ) {
      const asyncContext = this.getAsyncContext()
      const mainQQ = this.mainAccount.qq
      if (!asyncContext?.qq) {
        this.logger.info(`No context, will use main qq (${mainQQ})`)
        useQQ = mainQQ
      } else {
        this.logger.debug(`with context: `, asyncContext)
        useQQ = asyncContext.qq
      }
    }
    return useQQ
  }

  private async sendApi(opts: ISendApiOpts) {
    const { CgiRequest, qq } = opts
    const account = this.getAccount(qq)
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
    const data: ISendMsg = {
      CgiCmd: ESendCmd.send,
      CgiRequest,
    }
    // run interceptor
    const interceptors = this.advancedOptions
      .interceptors as IMahiroInterceptorFunction[]
    if (interceptors?.length) {
      const context: IMahiroInterceptorContext = {
        params,
        data,
        logger: this.loggerWithInterceptor,
        stack: cloneDeep(account.stack.get(CgiRequest.ToUin) || []),
      }
      for await (const inter of interceptors) {
        const notDrop = await inter(context)
        if (!notDrop) {
          this.logger.info(
            `[Interceptor] Drop message, account(${qq}) : `,
            JSON.stringify(data).slice(0, 100),
          )
          return
        }
      }
    }
    try {
      const res = await account.request.post(sendMsgUrl, data)
      // push to stack
      this.pushMsgToStack({ account, data })
      if (res?.data) {
        return res.data as ISendMsgResponse
      }
    } catch (e) {
      this.logger.error(`Send api error, account(${qq}) : `, e)
    }
  }

  private createUserGetter(opts: ISearchUserOpts) {
    return () => {
      return this.searchUser(opts)
    }
  }

  async searchUser(opts: ISearchUserOpts) {
    const { qq, Uid } = opts
    const account = this.getAccount(qq)
    if (!account.wsConnected) {
      this.logger.error(`WS not connected, search user failed, account(${qq})`)
      return
    }
    const params = {
      funcname: EFuncName.MagicCgiCmd,
      timeout: 10,
      qq,
    } satisfies ISendParams
    const stringifyParams = qs.stringify(params)
    const searchUrl = `${account.url}${OPQ_APIS.common}?${stringifyParams}`
    const data: ISearchUser = {
      CgiCmd: ESendCmd.search,
      CgiRequest: {
        Uid,
      },
    }
    try {
      const res = await account.request.post(searchUrl, data)
      if (res?.data) {
        return res.data as ISendMsgResponse<IResponseDataWithSearchUser>
      }
    } catch (e) {
      this.logger.error(`Search user api error, account(${qq}) : `, e)
    }
  }

  private async uploadFile(opts: IMahiroUploadFileOpts) {
    const { file, commandId, qq } = opts
    const account = this.getAccount(qq)
    if (!account.wsConnected) {
      this.logger.error(`WS not connected, upload file failed, account(${qq})`)
      return
    }
    this.logger.debug(
      `[Upload File] Will upload file, account(${qq}): `,
      file.slice(0, 100),
    )
    let { filePath, fileUrl, base64: Base64Buf } = await detectFileType(file)
    // check file
    let hasFilePath = !!filePath?.length
    const hasFileUrl = !!fileUrl?.length
    let hasBase64 = !!Base64Buf?.length
    if (hasFilePath) {
      if (!existsSync(filePath!)) {
        this.logger.error(`File not exists, account(${qq}): ${filePath}`)
        return
      }
      if (!isAbsolute(filePath!)) {
        this.logger.error(
          `File path must be absolute, account(${qq}): ${filePath}`,
        )
        return
      }
      if (!account.local) {
        // filePath auto convert to url when server not in local
        const base64 = await getFileBase64(filePath!)
        if (!base64) {
          this.logger.error(
            `[Upload File] The server is not in local, auto convert file to base64 failed, account(${qq}): ${filePath}`,
          )
          return
        }
        this.logger.debug(
          `[Upload File] The server is not in local, auto convert file to base64 success, account(${qq}): ${filePath}`,
        )
        // we assume a base64
        hasFilePath = false
        hasBase64 = true
        Base64Buf = base64
        this.logger.debug(
          `[Upload File] base64 preview, account(${qq}): ${base64.slice(
            0,
            20,
          )}...`,
        )
      }
    } else if (hasFileUrl) {
      const isUrl = fileUrl!.startsWith('http')
      if (!isUrl) {
        this.logger.error(
          `File url must be http or data, account(${qq}): ${fileUrl}`,
        )
        return
      }
    } else if (hasBase64) {
      // cannot prefix with data: protocol
      const withDataPrefix = Base64Buf!.startsWith('data:')
      if (withDataPrefix) {
        this.logger.error(
          `Base64 cannot prefix with data:, account(${qq}): ${Base64Buf?.slice(
            0,
            10,
          )}`,
        )
        return
      }
    } else {
      this.logger.error(
        `File absolute path or url required (e.g. /path/to/file or http://example.com/file.png or data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB), account(${qq})`,
      )
      return
    }
    this.logger.debug('[Upload File] Will use qq: ', qq)
    const uploadUrl = `${account.url}${OPQ_APIS.upload}?qq=${qq}`
    if (!hasFilePath && !hasFileUrl && !hasBase64) {
      this.logger.error(
        `[Upload File] Must provide file path or file url or base64, account(${qq})`,
      )
      return
    }
    const data: IUploadFile = {
      CgiCmd: ESendCmd.upload,
      CgiRequest: {
        CommandId: commandId,
        ...(hasFilePath
          ? {
              FilePath: filePath,
            }
          : hasFileUrl
          ? {
              FileUrl: fileUrl,
            }
          : {
              Base64Buf,
            }),
      },
    }
    try {
      const res = await account.request.post(uploadUrl, data)
      const json = res?.data as ISendMsgResponse | undefined
      if (json) {
        this.logger.debug(
          `[Upload File] Upload file success, account(${qq}): `,
          file.slice(0, 100),
          'response: ',
          JSON.stringify(json).slice(0, 100),
        )
        return json as ISendMsgResponse
      }
    } catch (e) {
      this.logger.error(`Upload file error, account(${qq}): `, e)
    }
  }

  private createAsyncContext(info: IAsyncContextInfo) {
    const withContext = (opts: {
      name: string
      cb: (...args: any[]) => any
    }) => {
      const { name, cb } = opts
      const timestamp = Date.now()
      const contextId = asyncHookUtils.hash({
        time: timestamp,
        name,
        ...info,
      })
      return new Promise<void>((resolve, _) => {
        this.logger.debug(`Run context (${name}): ${contextId}`)
        this.asyncLocalStorage.run(contextId, async () => {
          await cb()
          resolve()
        })
      })
    }
    return withContext
  }

  private pushMsgToStack(opts: { account: IAccont; data: ISendMsg }) {
    const { account, data } = opts
    const to = data.CgiRequest?.ToUin
    if (to) {
      const { max, timeout } = this.msgStackConfig
      const stack = account.stack.get(to) || []
      // check expired
      const now = Date.now()
      while (!!stack.length) {
        const timeGap = now - stack[0].time
        const isExpired = timeGap > timeout
        if (isExpired) {
          stack.shift()
        } else {
          break
        }
      }
      // check max
      if (stack.length >= max) {
        stack.shift()
      }
      // push
      stack.push({
        time: now,
        msg: data,
      })
      // max length
      account.stack.set(to, stack)
    }
  }

  async onGroupMessage(
    name: string,
    callback: IOnGroupMessage,
    opts: { internal?: boolean } = {},
  ) {
    const { internal = false } = opts
    this.logger.info(`Register ${chalk.green('onGroupMessage')}: `, name)
    const has = this.callback.onGroupMessage[name] as any as Partial<
      ICallbacks['onGroupMessage']
    >
    if (has) {
      throw new Error(`onGroupMessage ${name} has been registered`)
    } else {
      // check schema if callback is session
      await this.session.isSession(callback)
      this.callback.onGroupMessage[name] = callback
    }
    // register to database
    await this.db.registerPlugin({ name, internal })
    const unlistener: CancelListener = () => {
      delete this.callback.onGroupMessage[name]
    }
    return unlistener
  }

  async onFriendMessage(name: string, callback: IOnFriendMessage) {
    this.logger.info(`Register ${chalk.blue('onFriendMessage')}: `, name)
    const has = this.callback.onFreindMessage[name] as any as Partial<
      ICallbacks['onFreindMessage']
    >
    if (has) {
      throw new Error(`onFriendMessage ${name} has been registered`)
    } else {
      // check schema if callback is session
      await this.session.isSession(callback)
      this.callback.onFreindMessage[name] = callback
    }
    // TODO: can manage friends plugins in database
    const unlistener: CancelListener = () => {
      delete this.callback.onFreindMessage[name]
    }
    return unlistener
  }

  async onNativeEvent(name: string, callback: IOnNativeEvent) {
    this.logger.info(`Register ${chalk.yellow('onNativeEvent')}: `, name)
    const has = this.callback.onNativeEvent[name] as any as Partial<
      ICallbacks['onNativeEvent']
    >
    if (has) {
      throw new Error(`onNativeEvent ${name} has been registered`)
    } else {
      this.callback.onNativeEvent[name] = callback
    }
    const unlistener: CancelListener = () => {
      delete this.callback.onNativeEvent[name]
    }
    return unlistener
  }

  async onGroupEvent(name: string, callback: IOnGroupEvent) {
    this.logger.info(`Register ${chalk.green('onGroupEvent')}: `, name)
    const has = this.callback.onGroupEvent[name] as any as Partial<
      ICallbacks['onGroupEvent']
    >
    if (has) {
      throw new Error(`onGroupEvent ${name} has been registered`)
    } else {
      this.callback.onGroupEvent[name] = callback
    }
    const unlistener: CancelListener = () => {
      delete this.callback.onGroupEvent[name]
    }
    return unlistener
  }

  async sendGroupMessage(data: IApiSendGroupMessage) {
    this.logger.info(
      `Send ${chalk.green('group')} message: ${data.groupId}, ${
        data?.msg?.Content?.slice(0, 10) || ''
      }...`,
    )
    const {
      fastImage,
      msg = {
        Content: '',
      },
      groupId,
      qq,
    } = data
    // ensure msg content is string
    if (isNil(msg?.Content)) {
      msg.Content = ''
    }
    const useQQ = this.getUseQQ({
      specifiedQQ: qq,
    })
    if (fastImage?.length) {
      const res = (await this.uploadFile({
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
    const res = await this.sendApi({
      CgiRequest: {
        ToUin: groupId,
        ToType: EToType.group,
        ...(msg as IApiMsg),
      },
      qq: useQQ,
    })
    return res
  }

  async sendFriendMessage(data: IApiSendFriendMessage) {
    this.logger.info(
      `Send ${chalk.blue('friend')} message: ${data.userId}, ${
        data?.msg?.Content?.slice(0, 10) || ''
      }`,
    )
    const { fastImage, msg = { Content: '' }, userId, qq } = data
    // ensure msg content is string
    if (isNil(msg?.Content)) {
      msg.Content = ''
    }
    const useQQ = this.getUseQQ({
      specifiedQQ: qq,
    })
    // upload fast image
    if (fastImage?.length) {
      const res = (await this.uploadFile({
        file: fastImage,
        commandId: EUploadCommandId.friendImage,
        qq: useQQ,
      })) as ISendMsgResponse<IResponseDataWithImage> | undefined
      const fileInfo = res?.ResponseData
      if (!fileInfo?.FileMd5?.length) {
        this.logger.error('[FastImage] Upload file failed, not get fileMd5')
        return
      } else {
        this.logger.success('[FastImage] Upload file success (Friend)')
      }
      // add to msg
      msg.Images = [...(msg.Images || []), fileInfo]
    }
    const res = await this.sendApi({
      CgiRequest: {
        ToUin: userId,
        ToType: EToType.friends,
        ...(msg as IApiMsg),
      },
      qq: useQQ,
    })
    return res
  }

  private async startNodeServer() {
    const { port } = this.nodeServer
    const app = (this.app = express())
    this.addBaseServerMiddleware()
    this.addBaseServerRoutes()
    this.registryPythonForward()
    this.noticeToPythonMahiroStarted()
    this.startPythonServerHealthCheck()
    this.startWebSite()
    return new Promise<void>((resolve, _) => {
      app.listen(port, () => {
        this.logger.info(`[Node Server] start at ${chalk.magenta(port)}`)
        resolve()
      })
    })
  }

  async startPythonServerHealthCheck() {
    this.logger.debug('[Python] Start health check')
    if (this.pythonServerChecker) {
      // clear old timer
      clearInterval(this.pythonServerChecker)
    }
    // start new timer
    const url = `${this.pythonServerUrl}${PYTHON_SERVER_APIS.health}`
    const checker = async () => {
      // if max retry count, stop check
      if (this.pythonServerRetryCount > 10) {
        this.logger.debug(`[Python] Max retry count, stop health check`)
        // reset
        this.pythonServerRetryCount = 0
        clearInterval(this.pythonServerChecker)
        return
      }
      try {
        const res = (await this.mainAccount.request.get(url))?.data as
          | IPythonHealthResponse
          | undefined
        this.checkPythonRequiredVersion(res?.version)
        if (res?.code !== 200) {
          throw new Error('Health check failed')
        }
        this.pythonServerRetryCount = 0
      } catch {
        // offline
        this.logger.debug(
          `[Python] Health check failed, clear all python plugins, retry count: ${this.pythonServerRetryCount}`,
        )
        // clear all python plugins
        this.db.clearExternalPlugins()
        // add counts
        this.pythonServerRetryCount++
      }
    }
    this.pythonServerChecker = setInterval(checker, 3 * 1e3)
  }

  private async noticeToPythonMahiroStarted() {
    this.logger.debug('[Python] Notice mahiro started')
    try {
      await this.db.sendAuthTokenToPython({ once: true })
    } catch {
      this.logger.debug('[Python] Notice mahiro started failed')
    }
  }

  private startWebSite() {
    const app = this.app
    // start website apis
    this.db.createMiddleware(app)
    // start website
    try {
      const websiteDist = dirname(require.resolve('@xn-sakina/mahiro-web'))
      if (!existsSync(join(websiteDist, 'index.html'))) {
        this.logger.error('[Web Site] Website dist not found')
        return
      }
      app.use(
        serveStatic(join(websiteDist), {
          index: ['index.html'],
          // not need fallback, because we have use hash router
        }),
      )
      const url = `http://localhost:${this.nodeServer.port}`
      this.logger.info('[Web Site] Start at ', chalk.cyan(url))
    } catch {
      this.logger.warn('[Web Site] Website start failed')
    }
  }

  private addBaseServerMiddleware() {
    this.logger.debug('[Node Server] Add base middleware')
    const app = this.app
    app.use(
      bodyParser.json({
        limit: '10mb',
      }),
    )
    app.use(cors())
  }

  private addBaseServerRoutes() {
    this.logger.debug('[Node Server] Add base routes')
    const app = this.app
    // recive message
    app.post(SERVER_ROUTES.recive.group, async (req, res) => {
      const json = req.body as IApiSendGroupMessage
      try {
        // we keep the same schema with send message
        apiSchema.sendGroupMessage.parse(json)
        this.logger.debug(
          '[Node Server] Recive group message: ',
          JSON.stringify(json).slice(0, 100),
        )
        await this.sendGroupMessage(json)
        res.json({
          code: 200,
        })
        res.status(200)
      } catch {
        this.logger.error('[Node Server] Recive group message error: ', json)
        res.json({
          code: 500,
        })
        res.status(500)
      }
    })
    app.post(SERVER_ROUTES.recive.friend, async (req, res) => {
      const json = req.body as IApiSendFriendMessage
      try {
        apiSchema.sendFriendMessage.parse(json)
        this.logger.debug(
          '[Node Server] Recive friend message: ',
          JSON.stringify(json).slice(0, 100),
        )
        await this.sendFriendMessage(json)
        res.json({
          code: 200,
        })
        res.status(200)
      } catch {
        this.logger.error('[Node Server] Recive friend message error: ', json)
        res.json({
          code: 500,
        })
        res.status(500)
      }
    })
  }

  private async sendToPython(opts: { path: string; data: ISendToPythonData }) {
    const { path, data } = opts
    this.logger.debug(`[Node Server] Python Forward - ${path}: `, data)
    const url = `${this.pythonServerUrl}${path}`
    try {
      const res = await this.mainAccount.request.post(url, data, {
        validateStatus: () => true,
        timeout: 10 * 1e3,
      })
      if (res.status !== 200) {
        this.logger.error(
          `[Node Server] Python Forward - ${path} status error: `,
          res.status,
        )
      }
      if (res.data?.code !== 200) {
        this.logger.error(
          `[Node Server] Python Forward - ${path} response code error: ${res.data?.code},`,
        )
      }
      return res.data
    } catch {
      // python 掉了，需要清掉外部插件
      this.logger.warn(
        `[Node Server] Python Forward Offline, will clear plugins`,
      )
      this.db.clearExternalPlugins()
      this.logger.debug(`[Node Server] Python Forward - Failed`)
    }
  }

  private registryPythonForward() {
    const prefix = `[Node Server] Python Forward - `
    this.onGroupMessage(
      `${prefix}Group Message`,
      async (data, raw) => {
        await this.sendToPython({
          path: PYTHON_SERVER_APIS.sendGroupMsg,
          data: {
            ...data,
            raw,
          },
        })
      },
      {
        internal: true,
      },
    )
    this.onFriendMessage(`${prefix}Friend Message`, async (data, raw) => {
      await this.sendToPython({
        path: PYTHON_SERVER_APIS.sendGroupMsg,
        data: {
          ...data,
          raw,
        },
      })
    })
  }

  private async connectDatabase() {
    this.logger.info(`[Database] Connecting...`)
    this.db = new Database({
      path: this.advancedOptions.databasePath,
      mahiro: this,
    })
    await this.db.init()
    this.logger.info(`[Database] Connected`)
  }

  private registerOptionsInterceptors() {
    this.logger.debug(`[Interceptors] Registering...`)
    const interceptors = this.advancedOptions.interceptors
    for (let i = 0; i < interceptors.length; i++) {
      const value = interceptors[i]
      const isString = typeof value === 'string'
      if (isString) {
        try {
          interceptors[i] = require(value)
        } catch {
          this.logger.error(
            `[Interceptors] Register failed from path: ${value}`,
          )
        }
      }
    }
    this.logger.debug(`[Interceptors] Registered`)
  }

  private registerAdminManager() {
    this.logger.debug(`[Admin Manager] Registering...`)
    // todo: can config this
    const cmd = {
      open: /^\.open (.+)/,
      close: /^\.close (.+)/,
    } as const
    this.onGroupMessage(
      '[Admin Manager] Plugin Manager',
      async (data) => {
        const isAdmin = await this.db.isGroupAdmin({
          groupId: data.groupId,
          userId: data.userId,
        })
        if (!isAdmin) {
          return
        }
        const content = data.msg?.Content
        if (!content?.length) {
          return
        }
        const matchOpen = content.match(cmd.open)
        if (matchOpen) {
          const name = matchOpen[1]
          if (!name?.length || !trim(name)?.length) {
            return
          }
          this.logger.debug(`[Admin Manager] Open plugin: ${name}`)
          const success = await this.db.openPlugin({
            pluginName: trim(name),
            groupId: data.groupId,
          })
          if (success) {
            this.sendGroupMessage({
              groupId: data.groupId,
              msg: {
                Content: `插件 ${name} 已开启`,
              },
            })
          }
        }
        const matchClose = content.match(cmd.close)
        if (matchClose) {
          const name = matchClose[1]
          if (!name?.length || !trim(name)?.length) {
            return
          }
          this.logger.debug(`[Admin Manager] Close plugin: ${name}`)
          const success = await this.db.closePlugin({
            pluginName: trim(name),
            groupId: data.groupId,
          })
          if (success) {
            this.sendGroupMessage({
              groupId: data.groupId,
              msg: {
                Content: `插件 ${name} 已关闭`,
              },
            })
          }
          return
        }
      },
      {
        internal: true,
      },
    )
    this.logger.debug(`[Admin Manager] Registered`)
  }

  private createRequest(opts: { qq: number }) {
    const { qq } = opts
    const ins = axios.create({
      timeout: 20 * 1000,
      headers: {
        'content-type': 'application/json',
      },
    })
    ins.interceptors.response.use(
      (response) => {
        const res = response.data as Partial<ISendMsgResponse>
        const errorCode = res?.CgiBaseResponse?.Ret
        const hasErrorCode = errorCode !== ECgiBaseRes.success
        const hasErrorMsg = res?.CgiBaseResponse?.ErrMsg?.length
        if (hasErrorCode && hasErrorMsg) {
          const url = response.request?.responseURL
          this.logger.error(
            `[Response] Account(${qq}), URL(${url}), Error(code: ${errorCode}), ErrMsg(${res?.CgiBaseResponse?.ErrMsg})`,
          )
          return Promise.reject(res?.CgiBaseResponse?.ErrMsg)
        }
        return response
      },
      (err) => {
        return Promise.reject(err)
      },
    )
    return ins
  }

  async use(feature: IMahiroUse) {
    this.logger.debug(
      `[Use] Will register feature: ${feature?.name || 'unknown'}`,
    )
    await feature(this)
  }

  async registerInterceptor(interceptor: IMahiroInterceptor) {
    if (isString(interceptor)) {
      try {
        interceptor = require(interceptor)
        this.logger.debug(
          `[Interceptors] Registering from path: ${interceptor}`,
        )
      } catch {
        this.logger.error(
          `[Interceptors] Register failed from path: ${interceptor}`,
        )
      }
    }
    // add to interceptors
    this.advancedOptions.interceptors.push(interceptor)
  }

  async registerGroupMiddleware(middleware: IMahiroGroupMiddleware) {
    this.middlewares.group.push(middleware)
    this.logger.debug(
      `[Middlewares] Registering group middleware: ${
        middleware?.name || 'unknown'
      }`,
    )
    const clear = () => {
      const index = this.middlewares.group.indexOf(middleware)
      if (~index) {
        this.middlewares.group.splice(index, 1)
      }
    }
    return clear
  }

  async registerFriendMiddleware(middleware: IMahiroFriendMiddleware) {
    this.middlewares.friend.push(middleware)
    this.logger.debug(
      `[Middlewares] Registering friend middleware: ${
        middleware?.name || 'unknown'
      }`,
    )
    const clear = () => {
      const index = this.middlewares.friend.indexOf(middleware)
      if (~index) {
        this.middlewares.friend.splice(index, 1)
      }
    }
    return clear
  }

  async registerNativeMiddleware(middleware: IMahiroNativeMiddleware) {
    this.middlewares.native.push(middleware)
    this.logger.debug(
      `[Middlewares] Registering native middleware: ${
        middleware?.name || 'unknown'
      }`,
    )
    const clear = () => {
      const index = this.middlewares.native.indexOf(middleware)
      if (~index) {
        this.middlewares.native.splice(index, 1)
      }
    }
    return clear
  }

  private async callMiddlewares(opts: {
    middlewares: IMahiroMiddleware[]
    data: any
  }) {
    let data = opts.data
    for await (const middleware of opts.middlewares) {
      if (!middleware) {
        this.logger.debug(`[Middlewares] Skip nil middleware`)
        continue
      }
      const newData = await middleware(data)
      const name = middleware?.name || 'unknown'
      this.logger.debug(
        `[Middlewares] Call middleware: ${name}, with data: ${JSON.stringify(
          data,
        ).slice(0, 100)}`,
      )
      if (newData) {
        data = newData
      } else {
        this.logger.info(
          `[Middlewares] Middleware: ${name} return false, skip handle message`,
        )
        return false
      }
    }
    return data
  }

  private checkPythonRequiredVersion(version?: string) {
    const needVersion = this.otherConfigs.requiredPythonMahiroVersion
    if (version !== needVersion) {
      this.logger.error(
        `Python mahiro version not match, required: ${chalk.bold.blue(
          needVersion,
        )}, current: ${chalk.bold.red(
          version,
        )}, please update python mahiro by "${chalk.green(
          'pip install --upgrade mahiro',
        )}"`,
      )
    }
  }
}
