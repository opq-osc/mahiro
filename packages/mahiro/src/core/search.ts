import consola from 'consola'
import type { Mahiro } from '.'

export class Search {
  mahiro: Mahiro

  logger = consola.withTag('search') as typeof consola

  constructor(opts: { mahiro: Mahiro }) {
    this.mahiro = opts.mahiro
  }

  /**
   * @example 'xxxxx'(Uid) -> 12345678(Uin)
   */
  async getUinByUid(...args: Parameters<typeof this.mahiro.searchUser>) {
    return this.mahiro.searchUser(...args)
  }

  // alias
  getNumberByString = this.getUinByUid

  /**
   * need redis config
   * @important maybe get empty result
   * @example 12345678(Uin) -> 'xxxxx'(Uid)
   */
  async getUidByUin(
    ...args: Parameters<typeof this.mahiro.baka.getUserInfoCache2LevelByUin>
  ) {
    return this.mahiro.baka.getUserInfoCache2LevelByUin(...args)
  }

  // alias
  getStringByNumber = this.getUidByUin
}
