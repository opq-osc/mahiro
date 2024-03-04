import type { Mahiro } from "."
import { consola } from 'consola'
import { IAnoOpts } from "./interface"

export class Ano {
  mahiro!: Mahiro
  logger = consola.withTag('ano') as typeof consola

  constructor(opts: IAnoOpts) {
    this.mahiro = opts.mahiro
  }

  /**
   * @interface
   * @unimpl
   */
  async openGroupRedPacket() {
    throw new Error('Method not implemented. please use your own plugin to implement it.')
  }
}
