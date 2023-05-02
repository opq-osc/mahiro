/**
 * why not use `is-base64` ?
 * issue: https://github.com/miguelmota/is-base64/issues/10
 *
 * fork from https://github.com/webdriverio/webdriverio/issues/5208#issuecomment-613029075
 * https://github.com/webdriverio/webdriverio/pull/5260/files#diff-029d36da85e6d46b180da494a9873ce5eb543262f456b4120787adb21966c43c
 */
const notBase64 = new RegExp('[^A-Z0-9+\\/=]', 'i')
export function isBase64(str: string) {
  const isString = typeof str === 'string'
  if (!isString) {
    throw new Error('Expected string but received invalid type.')
  }
  const len = str.length
  if (!len || len % 4 !== 0 || notBase64.test(str)) {
    return false
  }
  const firstPaddingChar = str.indexOf('=')
  return (
    firstPaddingChar === -1 ||
    firstPaddingChar === len - 1 ||
    (firstPaddingChar === len - 2 && str[len - 1] === '=')
  )
}
