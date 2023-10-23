import { consola } from 'consola'

const logger = consola.withTag('node-polyfill') as typeof consola

const arrayAt = () => {
  if (!Array.prototype.at) {
    logger.info('Inject Array.prototype.at')
    Array.prototype.at = function (index) {
      return this[index < 0 ? this.length + index : index]
    }
  }
}

export const injectPolyfill = () => {
  arrayAt()
}
