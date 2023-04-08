import { Rule } from 'antd/es/form'
import { isStringNumber } from '.'

export const numberListValidator: Rule = {
  validator(rule, value, callback) {
    if (!value?.length) {
      return callback()
    }
    const hasNotNumber = value.some((i: string) => {
      return !isStringNumber(i)
    })
    if (hasNotNumber) {
      return callback('只能输入数字')
    }
    callback()
  },
  validateTrigger: 'onBlur',
}
