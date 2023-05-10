import { sample } from 'lodash'
import { IAvatarWay, IQzoneInfo } from './interface'
import axios from 'axios'
import { consola } from 'consola'
import iconv from 'iconv-lite'
import { EAvatarSize } from '../send/interface'

export class Avatar {
  avatarWays: IAvatarWay[] = [
    {
      // https://cloud.tencent.com/developer/article/1987577
      getUrl: (account, size) => {
        return `http://q1.qlogo.cn/g?b=qq&nk=${account}&s=${size}`
      },
    },
    {
      // https://wiki.connect.qq.com/%E7%94%A8%E6%88%B7%E5%9F%BA%E6%9C%AC%E4%BF%A1%E6%81%AF%E4%B8%AD%E7%9A%84%E7%94%A8%E6%88%B7%E5%A4%B4%E5%83%8Furl%E5%9F%9F%E5%90%8D%E5%8F%98%E6%9B%B4%E9%80%9A%E7%9F%A5
      getUrl: (account, size) => {
        return `https://thirdqq.qlogo.cn/headimg_dl?dst_uin=${account}&spec=${size}`
      },
    },
    {
      getUrl: (account, size) => {
        return `https://thirdqq2.qlogo.cn/headimg_dl?dst_uin=${account}&spec=${size}`
      },
    },
    {
      getUrl: (account, size) => {
        return `https://q.qlogo.cn/headimg_dl?dst_uin=${account}&spec=${size}`
      },
    },
    {
      getUrl: (account, size) => {
        return `https://q2.qlogo.cn/headimg_dl?dst_uin=${account}&spec=${size}`
      },
    },
  ]

  // https://www.useragents.me/
  ua: string[] = [
    `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36`,
    `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36 OPR/94.0.0.0 (Edition Yx GX)`,
    `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 YaBrowser/23.1.2.978 Yowser/2.5 Safari/537.36`,
    `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36`,
    `Mozilla/5.0 (Linux; Android 10; Redmi Note 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Mobile Safari/537.36`,
    `Mozilla/5.0 (Linux; Android 11; RMX1851) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Mobile Safari/537.36`,
    `Mozilla/5.0 (Linux; Android 12; Redmi Note 9 Pro Max) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Mobile Safari/537.36`,
    `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36 Edg/111.0.1661.43`,
    `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36 OPR/96.0.4693.80`,
    `Mozilla/5.0 (Macintosh; Intel Mac OS X 13_2_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36 OPR/96.0.4693.80`,
    `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36 OPR/96.0.4693.80`,
    `Mozilla/5.0 (iPad; CPU OS 16_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.3 Mobile/15E148 Safari/604.1`,
    `Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.5563.57 Mobile Safari/537.36`,
    `Mozilla/5.0 (Linux; Android 10; HD1913) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.5563.57 Mobile Safari/537.36 EdgA/110.0.1587.66`,
  ]

  logger = consola.withTag('avatar') as typeof consola

  // axios will auto throw error when status is not 200
  request = axios.create({
    timeout: 6 * 1e3,
  })

  constructor() {
    this.configRequest()
  }

  private configRequest() {
    this.request.interceptors.request.use((config) => {
      // auto add random ua to request
      const ua = this.randomUserAgent()
      this.logger.debug(`Random user-agent: ${ua}`)
      config.headers['User-Agent'] = ua
      // auto add timestap to query for prevent cache
      const ts = Date.now()
      config.params = {
        ...config.params,
        ts,
      }
      return config
    })
  }

  private randomUserAgent() {
    return sample(this.ua)
  }

  private async getRequestSuccessUrl(urls: string[]) {
    for await (const u of urls) {
      try {
        this.logger.debug(`Try request ${u}`)
        const res = await this.request.get(u)
        if (res) {
          this.logger.debug(`Request ${u} success`)
          return u
        }
        throw new Error('Request failed')
      } catch (e) {
        this.logger.warn(`Request ${u} failed, try next`)
      }
    }
    this.logger.error(`Try request all failed, first url: ${urls[0]}`)
    return
  }

  async getUserAvatarUrl(
    account: number,
    size: EAvatarSize = EAvatarSize.s_640,
  ) {
    const urls = this.avatarWays.map((way) => way.getUrl(account, size))
    const res = await this.getRequestSuccessUrl(urls)
    if (!res) {
      this.logger.error(`Get avatar failed, account: ${account}, size: ${size}`)
    }
    this.logger.success(
      `Get avatar success, account: ${account}, size: ${size}`,
    )
    return res
  }

  async getUserQzoneInfo(account: number) {
    try {
      // https://github.com/mashirozx/Sakura/issues/146
      // https://github.com/mashirozx/sakura/commit/8d0bbcd56aa649183fab0616ae7ca0df6f45e664
      const res = await this.request.get(
        `https://r.qzone.qq.com/fcg-bin/cgi_get_portrait.fcg?get_nick=1&uins=${account}`,
        // 🤔 How can use gbk request in axios?
        // `https://users.qzone.qq.com/fcg-bin/cgi_get_portrait.fcg?uins=${account}`,
        {
          responseType: 'arraybuffer',
        },
      )
      const decodedRes = iconv.decode(res.data, 'gbk')
      const matchObject = JSON.parse(
        decodedRes?.trim().match(/^portraitCallBack\((.*?)\)$/)?.[1] || '{}',
      )
      const list = matchObject?.[account]
      const avatar = list?.[0] as IQzoneInfo['avatar'] | undefined
      const nickname = list?.at(-2) as string | undefined
      if (!avatar?.length || !nickname?.length) {
        throw new Error(`Get qzone info failed, account: ${account}`)
      }
      const qzoneInfo: IQzoneInfo = {
        avatar,
        nickname,
      }
      return qzoneInfo
    } catch {
      this.logger.error(`Get qzone info failed, account: ${account}`)
      return
    }
  }
}
