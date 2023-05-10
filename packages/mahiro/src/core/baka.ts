import { consola } from 'consola'
import {
  IBakaOpts,
  IBanGroupMemberOpts,
  IDropGroupMessageOpts,
  IGetGroupMemberListOpts,
  IGroupListOpts,
  IKickGroupMemberOpts,
  IMessageSnapshotGetterOpts,
  ISendApiOpts,
  OPQ_APIS,
  banGroupMemberSchema,
  dropSchema,
  getGroupDataTTL,
  getMessageSnapshotTTL,
  kickGroupMemberSchema,
} from './interface'
import type { Mahiro } from '.'
import {
  EFuncName,
  ESendCmd,
  ESsoGroupOp,
  ICgiRequestUnion,
  ICgiRequestWithBanGroupMember,
  ICgiRequestWithDropMessage,
  ICgiRequestWithGetGroupList,
  ICgiRequestWithGetGroupMemberList,
  ICgiRequestWithKickGroupMember,
  IGroupList,
  IGroupListMap,
  IGroupMemberList,
  IGroupMemberListMap,
  IResponseDataWithGroupList,
  IResponseDataWithGroupMemberList,
  ISendMsg,
  ISendMsgResponse,
  ISendParams,
} from '../send/interface'
import qs from 'qs'
import { IMsg, IMsgHead } from '../received/interface'
import { isNil, uniqBy } from 'lodash'
import { sleep } from '../utils'

export class Baka {
  logger = consola.withTag('baka') as typeof consola

  mahiro!: Mahiro

  // snapshot
  snapshotKey = 'mahiro:baka:snapshot:group'
  snapshotTTL = getMessageSnapshotTTL()

  // group list cache
  groupListCacheKey = 'mahiro:baka:cache:group:list'
  groupListCacheTTL = getGroupDataTTL()

  // group member list cache
  groupMemberListCacheKey = 'mahiro:baka:cache:group:member:list'
  groupMemberListCacheTTL = getGroupDataTTL()

  // user 2 level cache
  user2LevelCacheKey = 'mahiro:baka:cache:group:user:2level'
  user2LevelCacheTTL = getGroupDataTTL()

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
    const useQQ = this.mahiro.getUseQQ({
      specifiedQQ: qq,
    })
    this.logger.info(
      `Drop group message, use account ${useQQ}, groupId: ${to.FromUin}`,
    )
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
    if (
      isNil(MsgHead?.FromUin) ||
      isNil(MsgHead?.MsgSeq) ||
      isNil(MsgHead?.MsgTime)
    ) {
      this.logger.debug(
        `Message snapshot failed, because missing some fields, MsgHead: ${JSON.stringify(
          MsgHead,
        )}`,
      )
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
      this.logger.warn(
        `Get message snapshot failed, because missing some fields, opts: ${JSON.stringify(
          opts,
        )}`,
      )
      return
    }
    const key = `${this.snapshotKey}:${FromUin}:${MsgSeq}:${MsgTime}`
    const value = await this.mahiro.db.redisKV.get(key)
    if (isNil(value)) {
      this.logger.warn(
        `Get message snapshot failed, key: ${key}, expired or not exists`,
      )
      return
    }
    const json = JSON.parse(value)
    this.logger.debug(`Get message snapshot success, key: ${key}`)
    return json as IMsg
  }

  async banGroupMember(opts: IBanGroupMemberOpts) {
    let { to, qq, BanTime, userId, groupId } = opts
    this.logger.debug(
      `Ban group member, to: ${JSON.stringify(to)}, ban time: ${BanTime}`,
    )
    // 30 days
    const maxTime = 30 * 24 * 3600
    const isBanTimeAvailable =
      (!isNil(BanTime) && BanTime >= 60 && BanTime <= maxTime) || BanTime === 0
    if (!isBanTimeAvailable) {
      this.logger.error(
        `Ban time invalid, ban time: ${BanTime}, ban time must between 60 and ${maxTime}, or 0 (unlock)`,
      )
      return
    }
    const useQQ = this.mahiro.getUseQQ({
      specifiedQQ: qq,
    })
    // validate
    // use `to`
    if (!isNil(to)) {
      try {
        banGroupMemberSchema.parse(to)
      } catch (e) {
        this.logger.error(`Validate to failed, error:`, e)
        return
      }
    } else if (!isNil(userId) && !isNil(groupId)) {
      // first get from 2 level cache
      const userInfo = await this.getUserInfoCache2LevelByUin(userId)
      if (userInfo?.SenderUid?.length) {
        this.logger.debug(
          `Get user info from 2 level cache success, userId: ${userId}`,
        )
        // add to `to`
        to = {
          Uid: userInfo.SenderUid,
          Uin: groupId,
        }
      } else {
        // we auto detect user uid from group member list
        const groupMemberList = await this.getGroupMemberListMap({
          groupId,
          qq: useQQ,
        })
        const memberInfo = groupMemberList?.[userId]
        if (!memberInfo?.Uid?.length) {
          this.logger.error(
            `Validate to failed, user not in group, userId: ${userId}, groupId: ${groupId}`,
          )
          return
        }
        // add to `to`
        to = {
          Uid: memberInfo.Uid,
          Uin: groupId,
        }
      }
    } else {
      // never
      this.logger.error(
        `Validate to failed, You should use \`to\` or \`userId\` and \`groupId\``,
      )
      return
    }
    // ensure has `to`
    this.logger.info(
      `Ban group member ${to.Uin}, message uid: ${to.Uid}, use account ${useQQ}`,
    )
    const { Uin, Uid } = to
    const res = await this.sendBakaApi<
      ICgiRequestWithBanGroupMember,
      ESendCmd.sso_group_op
    >({
      CgiRequest: {
        Uin,
        Uid,
        OpCode: ESsoGroupOp.ban_group_member,
        BanTime,
      },
      CgiCmd: ESendCmd.sso_group_op,
      qq: useQQ,
    })
    return res
  }

  async kickGroupMember(opts: IKickGroupMemberOpts) {
    let { to, qq, userId, groupId } = opts
    this.logger.debug(`Kick group member, to: ${JSON.stringify(to)}`)
    const useQQ = this.mahiro.getUseQQ({
      specifiedQQ: qq,
    })
    // validate
    // use `to`
    if (!isNil(to)) {
      try {
        kickGroupMemberSchema.parse(to)
      } catch (e) {
        this.logger.error(`Validate to failed, error:`, e)
        return
      }
    } else if (!isNil(userId) && !isNil(groupId)) {
      // first get from 2 level cache
      const userInfo = await this.getUserInfoCache2LevelByUin(userId)
      if (userInfo?.SenderUid?.length) {
        this.logger.debug(
          `Get user info from 2 level cache success, userId: ${userId}`,
        )
        // add to `to`
        to = {
          Uid: userInfo.SenderUid,
          Uin: groupId,
        }
      } else {
        // we auto detect user uid
        const groupMemberList = await this.getGroupMemberListMap({
          groupId,
          qq: useQQ,
        })
        const memberInfo = groupMemberList?.[userId]
        if (!memberInfo?.Uid?.length) {
          this.logger.error(
            `Validate to failed, user not in group, userId: ${userId}, groupId: ${groupId}`,
          )
          return
        }
        // add to `to`
        to = {
          Uid: memberInfo.Uid,
          Uin: groupId,
        }
      }
    } else {
      // never
      this.logger.error(
        `Validate to failed, You should use \`to\` or \`userId\` and \`groupId\``,
      )
      return
    }
    this.logger.info(
      `Kick group member ${to.Uin}, message uid: ${to.Uid}, use account ${useQQ}`,
    )
    const { Uin, Uid } = to
    const res = await this.sendBakaApi<
      ICgiRequestWithKickGroupMember,
      ESendCmd.sso_group_op
    >({
      CgiRequest: {
        Uin,
        Uid,
        OpCode: ESsoGroupOp.kick_group_member,
      },
      CgiCmd: ESendCmd.sso_group_op,
      qq: useQQ,
    })
    return res
  }

  private async randomSleep() {
    // random sleep 0.5s - 1.5s
    const sleepTime = Math.floor(Math.random() * 1000) + 500
    await sleep(sleepTime)
    this.logger.info(`Poll multi page search, random sleep ${sleepTime}ms ...`)
  }

  async getGroupListMap(data: IGroupListOpts = {}) {
    if (!this.mahiro.db.isRedisKVAvailable) {
      throw new Error(`Use 'getGroupList' api must enable redis kv`)
    }
    const { qq, force } = data
    this.logger.debug(`Get group list api`)
    const useQQ = this.mahiro.getUseQQ({
      specifiedQQ: qq,
    })
    this.logger.info(`Get group list, use account: ${useQQ}`)
    const key = `${this.groupListCacheKey}:${useQQ}`
    this.logger.debug(`Get group list, key: ${key}`)
    if (force) {
      this.logger.warn(
        `Very dangerous, Get group list force mode, ignore cache`,
      )
    } else {
      // get from cache
      const cache = await this.mahiro.db.redisKV.get(key)
      if (cache) {
        this.logger.info(`Get group list from cache`)
        return cache as IGroupListMap
      }
    }
    // get from api
    const allData: IGroupList[] = []
    const pageSeach = async (page?: string) => {
      this.logger.debug(
        `Get group list, page: ${page?.length ? page : 'first page'}`,
      )
      const res = await this.sendBakaApi<
        ICgiRequestWithGetGroupList,
        ESendCmd.get_group_list
      >({
        CgiRequest: page?.length
          ? {
              LastBuffer: page,
            }
          : {},
        CgiCmd: ESendCmd.get_group_list,
        qq: useQQ,
      })
      const data = res?.ResponseData as IResponseDataWithGroupList | undefined
      if (data?.GroupLists?.length) {
        // push
        data.GroupLists.forEach((group) => {
          allData.push(group)
        })
        this.logger.debug(
          `Push group list success, length: ${data.GroupLists.length}`,
        )
      }
      // has next page
      const hasNextPage = data?.LastBuffer?.length
      if (hasNextPage) {
        // random sleep
        await this.randomSleep()
        await pageSeach(data.LastBuffer)
      } else {
        this.logger.debug(
          `Not has next page, group list search done, all data length: ${allData.length}`,
        )
      }
    }
    await pageSeach()
    // uniq
    const uniqData = uniqBy(
      allData.filter((i) => !isNil(i?.GroupCode)),
      (i) => i?.GroupCode,
    )
    const uniqDataMap = uniqData.reduce<IGroupListMap>((acc, cur) => {
      acc[cur.GroupCode] = cur
      return acc
    }, {})
    // cache to redis
    await this.mahiro.db.redisKV.set(key, uniqDataMap, this.groupListCacheTTL)
    this.logger.info(
      `Get group list success, length: ${uniqData.length}, cache to redis`,
    )
    return uniqDataMap
  }

  async getGroupMemberListMap(data: IGetGroupMemberListOpts) {
    if (!this.mahiro.db.isRedisKVAvailable) {
      throw new Error(`Use 'getGroupMemberList' api must enable redis kv`)
    }
    const { qq, force, groupId } = data
    if (isNil(groupId)) {
      throw new Error(`'getGroupMemberList' api must have 'groupId'`)
    }
    this.logger.debug(`Get group member list api`)
    const useQQ = this.mahiro.getUseQQ({
      specifiedQQ: qq,
    })
    this.logger.info(
      `Get group member list, use account: ${useQQ}, groupId: ${groupId}`,
    )
    const key = `${this.groupMemberListCacheKey}:${useQQ}:${groupId}`
    this.logger.debug(`Get group member list, key: ${key}`)
    if (force) {
      this.logger.warn(
        `Very dangerous, Get group member list force mode, ignore cache`,
      )
    } else {
      // get from cache
      const cache = await this.mahiro.db.redisKV.get(key)
      if (cache) {
        this.logger.info(`Get group member list from cache`)
        return cache as IGroupMemberListMap
      }
    }
    // get from api
    const allData: IGroupMemberList[] = []
    const pageSeach = async (page?: string) => {
      this.logger.debug(
        `Get group member list, page: ${page?.length ? page : 'first page'}`,
      )
      const res = await this.sendBakaApi<
        ICgiRequestWithGetGroupMemberList,
        ESendCmd.get_group_member_list
      >({
        CgiRequest: page?.length
          ? {
              LastBuffer: page,
              Uin: groupId,
            }
          : {
              Uin: groupId,
            },
        CgiCmd: ESendCmd.get_group_member_list,
        qq: useQQ,
      })
      const data = res?.ResponseData as
        | IResponseDataWithGroupMemberList
        | undefined
      if (data?.MemberLists?.length) {
        // push
        data.MemberLists.forEach((group) => {
          allData.push(group)
        })
        this.logger.debug(
          `Push group member list success, length: ${data.MemberLists.length}`,
        )
      }
      // has next page
      const hasNextPage = data?.LastBuffer?.length
      if (hasNextPage) {
        // random sleep
        await this.randomSleep()
        await pageSeach(data.LastBuffer)
      } else {
        this.logger.debug(
          `Not has next page, group memberlist search done, all data length: ${allData.length}`,
        )
      }
    }
    await pageSeach()
    // uniq
    const uniqData = uniqBy(
      allData.filter((i) => !isNil(i?.Uin)),
      (i) => i?.Uin,
    )
    const uniqDataMap = uniqData.reduce<IGroupMemberListMap>((acc, cur) => {
      acc[cur.Uin] = cur
      return acc
    }, {})
    // cache to redis
    await this.mahiro.db.redisKV.set(
      key,
      uniqDataMap,
      this.groupMemberListCacheTTL,
    )
    this.logger.info(
      `Get group member list success, length: ${uniqData.length}, cache to redis`,
    )
    return uniqDataMap
  }

  /**
   * for 2 level user info cache
   *
   * we auto cache user info when user every send message
   * when we need user info, this will be used as a `2 level` high priority
   */
  async setUserInfoCache2Level(head: IMsgHead) {
    if (!this.mahiro.db.isRedisKVAvailable) {
      // skip
      return
    }
    if (isNil(head?.SenderUin)) {
      this.logger.warn(`User info cache 2 level fail, head.SenderUin is empty`)
      return
    }
    const key = `${this.user2LevelCacheKey}:${head.SenderUin}`
    const hasKey = await this.mahiro.db.redisKV.has(key)
    if (hasKey) {
      this.logger.debug(`User info cache 2 level has key, ignore, key: ${key}`)
      // not need cache
      return
    }
    // cache
    await this.mahiro.db.redisKV.set(key, head, this.user2LevelCacheTTL)
    this.logger.debug(`User info cache 2 level success, key: ${key}`)
  }

  async getUserInfoCache2LevelByUin(uin: number) {
    if (!this.mahiro.db.isRedisKVAvailable) {
      // skip
      return
    }
    const key = `${this.user2LevelCacheKey}:${uin}`
    const value = await this.mahiro.db.redisKV.get(key)
    if (!value) {
      this.logger.debug(`Get user info cache 2 level fail, key: ${key}`)
      return
    }
    this.logger.debug(`Get user info cache 2 level success, key: ${key}`)
    return value as IMsgHead
  }
}
