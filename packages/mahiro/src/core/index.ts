import {
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
  DEFAULT_NETWORK,
  INodeServerOpts,
  DEFAULT_NODE_SERVER,
  SERVER_ROUTES,
  apiSchema,
  ASYNC_CONTEXT_SPLIT,
  IMahiroInterceptorContext,
  IMahiroInterceptorFunction,
  IMahiroMsgStack,
  IMahiroUploadFileOpts,
  IApiMsg,
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
  ISendImage,
} from '../send/interface'
import qs from 'qs'
import { parse } from 'url'
import {
  EC2cCmd,
  EFromType,
  EMsgEvent,
  EMsgType,
  IMsg,
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
import { cloneDeep, isNil, trim } from 'lodash'
import { detectFileType, getFileBase64 } from '../utils/file'

export class Mahiro {
  // base props
  ws!: string
  url!: string
  // is server in local
  isLocal = false
  qq!: number
  logger = consola
  loggerWithInterceptor = consola.withTag('interceptor') as typeof consola

  // ws instance
  wsIns!: WebSocket
  wsRetrying = false
  wsConnected = false

  // more options
  advancedOptions!: Required<IMahiroAdvancedOptions>

  // node server
  app!: express.Express
  nodeServer!: Required<INodeServerOpts>
  pythonServerCannotConnect = false

  // listeners
  callback: ICallbacks = {
    onGroupMessage: {},
    onFreindMessage: {},
  }

  // db
  db!: Database

  // status
  initialled = false

  // async context
  asyncLocalStorage = new AsyncLocalStorage()

  // msg stack
  msgStack: IMahiroMsgStack = new Map()
  msgStackConfig = {
    timeout: 3 * 60 * 1e3,
    max: 10,
  }

  constructor(opts: IMahiroOpts) {
    this.printLogo()
    this.checkInitOpts(opts)
    this.initUrl()
  }

  async run() {
    this.logger.info('Mahiro is starting...')
    await this.connect()
    await this.connectDatabase()
    await this.startNodeServer()
    this.registerInterceptors()
    this.registerAdminManager()
    this.logger.success('Mahiro started')
    this.initialled = true
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

  private initUrl() {
    const parsed = parse(this.ws)
    // check local
    const isLocal = ['localhost', '127.0.0.1', '0.0.0.0'].includes(
      parsed.hostname || '',
    )
    this.isLocal = isLocal
    this.logger.debug('[Local] Is local: ', isLocal)
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
          databasePath: z
            .string()
            .default(DEFAULT_ADANCED_OPTIONS.databasePath),
          interceptors: z
            .array(
              z.union([z.string(), z.custom((v) => typeof v === 'function')]),
            )
            .default(DEFAULT_ADANCED_OPTIONS.interceptors),
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
    // qq
    this.qq = result.qq
    // advancedOptions
    this.advancedOptions =
      result.advancedOptions as Required<IMahiroAdvancedOptions>
    this.logger.debug('Advanced options: ', this.advancedOptions)
    // nodeServer
    this.nodeServer = result.nodeServer as Required<INodeServerOpts>
    this.logger.debug('Node server options: ', this.nodeServer)

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

  private async connect() {
    let resolve = () => {}
    const promise = new Promise((_resolve, _) => {
      resolve = _resolve as any
    })
    this.wsRetrying = false
    this.logger.info('Try connect...')
    const ws: WebSocket = (this.wsIns = new WebSocket(this.ws))

    const retryConnect = (time: number = 5 * 1e3) => {
      if (this.wsRetrying) {
        return
      }
      this.logger.warn('Retry connect..., wait ', time, 'ms')
      this.wsRetrying = true
      setTimeout(() => {
        this.connect()
      }, time)
    }

    ws.on('error', (err) => {
      this.logger.error(`WS Error: `, err)
    })

    ws.on('open', () => {
      this.logger.success('WS Connected', this.ws)
      this.wsConnected = true
      resolve()
    })

    ws.on('message', (data: Buffer) => {
      const str = data.toString()
      this.logger.debug('WS Message: ', str)
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

    ws.on('close', () => {
      this.logger.warn('WS Closed')
      this.wsConnected = false
      retryConnect()
    })

    return promise
  }

  private async triggerListener(json: IMsg) {
    const { CurrentPacket, CurrentQQ } = json
    if (CurrentQQ !== this.qq) {
      this.logger.error('CurrentQQ not match: ', CurrentQQ)
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
        configs: {
          availablePlugins: [],
        },
      } as IGroupMessage
      // ignore myself
      if (ignoreMyself && data.userId === this.qq) {
        return
      }
      // trigger callback
      this.logger.info(
        `Received ${chalk.green('group')} message: `,
        `${data?.groupName}(${data?.groupId})`,
        `${data?.userNickname}(${data?.userId})`,
      )
      // group expired
      const isValid = await this.db.isGroupValid(data.groupId)
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
      Object.entries(this.callback.onGroupMessage).forEach(([name, cb]) => {
        const isAvaliable = avaliablePlugins.includes(name)
        if (!isAvaliable) {
          return
        }
        const timestamp = Date.now()
        const contextId = `${name}${ASYNC_CONTEXT_SPLIT}${timestamp}`
        this.asyncLocalStorage.run(contextId, () => {
          cb(data, json)
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
        `${data?.userName}(${data?.userId})`,
      )
      // trigger callback
      Object.entries(this.callback.onFreindMessage).forEach(([name, cb]) => {
        const timestamp = Date.now()
        const contextId = `${name}${ASYNC_CONTEXT_SPLIT}${timestamp}`
        this.asyncLocalStorage.run(contextId, () => {
          cb(data, json)
        })
      })
      return
    }
  }

  private async sendApi(opts: { CgiRequest: ISendMsg['CgiRequest'] }) {
    if (!this.wsConnected) {
      this.logger.error('WS not connected, send api failed')
      return
    }
    const { CgiRequest } = opts
    const params = {
      funcname: EFuncName.MagicCgiCmd,
      timeout: 10,
      qq: this.qq,
    } satisfies ISendParams
    const stringifyParams = qs.stringify(params)
    const sendMsgUrl = `${this.url}/v1/LuaApiCaller?${stringifyParams}`
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
        stack: cloneDeep(this.msgStack.get(CgiRequest.ToUin) || []),
      }
      for await (const inter of interceptors) {
        const notDrop = await inter(context)
        if (!notDrop) {
          this.logger.info('[Interceptor] Drop message: ', JSON.stringify(data))
          return
        }
      }
    }
    try {
      const res = await axios.post(sendMsgUrl, data)
      // push to stack
      this.pushMsgToStack(data)
      if (res?.data) {
        return res.data as ISendMsgResponse
      }
    } catch (e) {
      this.logger.error('Send api error: ', e)
    }
  }

  private async uploadFile(opts: IMahiroUploadFileOpts) {
    if (!this.wsConnected) {
      this.logger.error('WS not connected, upload file failed')
      return
    }
    const { file, commandId } = opts
    this.logger.debug('[Upload File] Will upload file: ', file)
    let { filePath, fileUrl } = detectFileType(file)
    // check file
    let hasFilePath = !!filePath?.length
    if (hasFilePath) {
      if (!existsSync(filePath!)) {
        this.logger.error(`File not exists: ${filePath}`)
        return
      }
      if (!isAbsolute(filePath!)) {
        this.logger.error(`File path must be absolute: ${filePath}`)
        return
      }
      if (!this.isLocal) {
        this.logger.error(
          `[Upload File] Currently the server is not in local, not support upload file: ${filePath}`,
        )
        // todo: support base64
        return
        // filePath auto convert to url when server not in local
        // const base64 = await getFileBase64(filePath!)
        // if (!base64) {
        //   this.logger.error(
        //     `[Upload File] The server is not in local, auto convert file to base64 failed: ${filePath}`,
        //   )
        //   return
        // }
        // this.logger.debug(
        //   `[Upload File] The server is not in local, auto convert file to base64 success: ${filePath}`,
        // )
        // hasFilePath = false
        // fileUrl = base64
      }
    } else if (fileUrl?.length) {
      const isUrl = fileUrl.startsWith('http')
      const isData = fileUrl.startsWith('data:')
      if (!isUrl && !isData) {
        this.logger.error(`File url must be http or data: ${fileUrl}`)
        return
      }
    } else {
      this.logger.error(
        'File absolute path or url required (e.g. /path/to/file or http://example.com/file.png or data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB)',
      )
      return
    }
    const uploadUrl = `${this.url}/v1/upload`
    const data: IUploadFile = {
      CgiCmd: ESendCmd.upload,
      CgiRequest: {
        CommandId: commandId,
        ...(hasFilePath
          ? {
              FilePath: filePath,
            }
          : {
              FileUrl: fileUrl,
            }),
      },
    }
    try {
      const res = await axios.post(uploadUrl, data)
      const json = res?.data as ISendMsgResponse | undefined
      if (json) {
        this.logger.debug(
          '[Upload File] Upload file success: ',
          file,
          'response: ',
          json,
        )
        return json as ISendMsgResponse
      }
    } catch (e) {
      this.logger.error('Upload file error: ', e)
    }
  }

  private pushMsgToStack(data: ISendMsg) {
    const to = data.CgiRequest?.ToUin
    if (to) {
      const { max, timeout } = this.msgStackConfig
      const stack = this.msgStack.get(to) || []
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
      this.msgStack.set(to, stack)
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
      throw new Error(`Plugin ${name} has been registered`)
    } else {
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
      throw new Error(`Plugin ${name} has been registered`)
    } else {
      this.callback.onFreindMessage[name] = callback
    }
    // TODO: can manage friends plugins in database
    const unlistener: CancelListener = () => {
      delete this.callback.onFreindMessage[name]
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
    } = data
    // ensure msg content is string
    if (isNil(msg?.Content)) {
      msg.Content = ''
    }
    if (fastImage?.length) {
      const res = await this.uploadFile({
        file: fastImage,
        commandId: EUploadCommandId.groupImage,
      })
      const fileInfo = res?.ResponseData as ISendImage
      if (!fileInfo?.FileMd5?.length) {
        this.logger.error('[FastImage] Upload file failed, not get fileMd5')
        return
      } else {
        this.logger.success('[FastImage] Upload file success (Group)')
      }
      // add to msg
      msg.Images = [...(msg.Images || []), fileInfo]
    }
    // todo: async context 插件粒度的出口限速
    // const contextId = this.asyncLocalStorage.getStore()
    const res = await this.sendApi({
      CgiRequest: {
        ToUin: groupId,
        ToType: EToType.group,
        ...(msg as IApiMsg),
      },
    })
    return res
  }

  async sendFriendMessage(data: IApiSendFriendMessage) {
    this.logger.info(
      `Send ${chalk.blue('friend')} message: ${data.userId}, ${
        data?.msg?.Content?.slice(0, 10) || ''
      }`,
    )
    const { fastImage, msg = { Content: '' }, userId } = data
    // ensure msg content is string
    if (isNil(msg?.Content)) {
      msg.Content = ''
    }
    // upload fast image
    if (fastImage?.length) {
      const res = await this.uploadFile({
        file: fastImage,
        commandId: EUploadCommandId.friendImage,
      })
      const fileInfo = res?.ResponseData as ISendImage
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
    })
    return res
  }

  private async startNodeServer() {
    const { port } = this.nodeServer
    const app = (this.app = express())
    this.addBaseServerMiddleware()
    this.addBaseServerRoutes()
    this.registryPythonForward()
    this.startWebSite()
    return new Promise<void>((resolve, _) => {
      app.listen(port, () => {
        this.logger.info(`[Node Server] start at ${chalk.magenta(port)}`)
        resolve()
      })
    })
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
    app.use(express.json())
    app.use(cors())
  }

  private addBaseServerRoutes() {
    this.logger.debug('[Node Server] Add base routes')
    const app = this.app
    // recive message
    app.post(SERVER_ROUTES.recive.group, async (req, res) => {
      const json = req.body as IApiSendGroupMessage
      try {
        apiSchema.sendGroupMessage.parse(json)
        // todo: transform to api schema
        this.logger.debug(
          '[Node Server] Recive group message: ',
          JSON.stringify(json),
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
        // todo: transform to api schema
        this.logger.debug(
          '[Node Server] Recive friend message: ',
          JSON.stringify(json),
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

  private async sendToPython(opts: {
    path: string
    data: Record<string, any>
  }) {
    const { path, data } = opts
    const base = `http://0.0.0.0:${this.nodeServer.pythonPort}`
    this.logger.debug(`[Node Server] Python Forward - ${path}: `, data)
    const url = `${base}${path}`
    try {
      const res = await axios.post(url, data)
      if (res.status !== 200) {
        this.logger.error(
          `[Node Server] Python Forward - ${path} status error: `,
          res.status,
        )
      }
      if (res.data?.code !== 200) {
        this.logger.error(
          `[Node Server] Python Forward - ${path} response code error: `,
          res.data?.code,
        )
      }
      return res.data
    } catch (e) {
      // python 掉了，需要清掉外部插件
      this.logger.debug(
        `[Node Server] Python Forward Offline, will clear plugins`,
      )
      this.db.clearExternalPlugins()
      // warn only once
      if (!this.pythonServerCannotConnect) {
        // only log once
        this.logger.warn(`[Node Server] Python Forward - Failed`)
        this.pythonServerCannotConnect = true
      }
    }
  }

  private registryPythonForward() {
    const prefix = `[Node Server] Python Forward - `
    const pathWithGroup = `/recive/group`
    this.onGroupMessage(
      `${prefix}Group Message`,
      async (data) => {
        await this.sendToPython({
          path: pathWithGroup,
          data,
        })
      },
      {
        internal: true,
      },
    )
    const pathWithFriend = `/recive/friend`
    this.onFriendMessage(`${prefix}Friend Message`, async (data) => {
      await this.sendToPython({
        path: pathWithFriend,
        data,
      })
    })
  }

  private async connectDatabase() {
    this.logger.info(`[Database] Connecting...`)
    this.db = new Database({
      path: this.advancedOptions.databasePath,
    })
    await this.db.init()
    this.logger.info(`[Database] Connected`)
  }

  private registerInterceptors() {
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
}
