import chalk from 'create-mahiro/compiled/chalk'

export const logger = {
  info: (...args: any[]) => {
    console.log(chalk.cyan('info   '), '-', ...args)
  },
  warn: (...args: any[]) => {
    console.log(chalk.yellow('warn   '), '-', ...args)
  },
  error: (...args: any[]) => {
    console.log(chalk.red('error  '), '-', ...args)
  },
  success: (...args: any[]) => {
    console.log(chalk.green('success'), '-', ...args)
  },
}
