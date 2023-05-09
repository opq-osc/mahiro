import { consola } from 'consola'
import {
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  writeFileSync,
  removeSync,
} from 'fs-extra'
import { join, relative } from 'path'

const logger = consola.withTag('crash') as typeof consola

const getCrashLogDir = () => {
  const cwd = process.cwd()
  const nodeModules = join(cwd, 'node_modules')
  const saveDir =
    existsSync(nodeModules) && statSync(nodeModules).isDirectory()
      ? join(nodeModules, '.cache', 'mahiro-crash')
      : join(__dirname, 'mahiro-crash')
  // ensure dir
  if (!existsSync(saveDir)) {
    mkdirSync(saveDir, { recursive: true })
  }
  return saveDir
}

export const clearCrashLogs = () => {
  const saveDir = getCrashLogDir()
  if (existsSync(saveDir) && statSync(saveDir).isDirectory()) {
    // remove dir
    logger.info(`Clear crash logs in ${saveDir}`)
    removeSync(saveDir)
    logger.success(`Clear crash logs success`)
  }
}

// when mahiro started, we auto detect logs
export const printCrashLogTips = () => {
  const saveDir = getCrashLogDir()
  const cwd = process.cwd()
  if (existsSync(saveDir) && statSync(saveDir).isDirectory()) {
    const files = readdirSync(saveDir).filter((file) => file.endsWith('.log'))
    if (files.length) {
      logger.error(`You have ${files.length} crash logs:`)
      files.forEach((file) => {
        logger.warn(`- ${relative(cwd, join(saveDir, file))}`)
      })
      logger.warn(`Please report to https://github.com/opq-osc/mahiro/issues`)
      logger.warn(`Use \`mahiro clean\` to clear crash logs`)
    }
  }
}

export const saveCrashLog = (err: any) => {
  const saveDir = getCrashLogDir()
  const savePath = join(saveDir, `${Date.now()}.log`)
  let errorMsg: string | undefined
  try {
    if (err instanceof Error) {
      errorMsg = err?.stack || err?.message
    } else if (typeof err === 'string') {
      errorMsg = err
    } else if (typeof err === 'object') {
      errorMsg = JSON.stringify(err)
    }
  } catch {
    logger.error(`Error stringify failed: ${err}`)
    return
  }
  if (!errorMsg?.length) {
    logger.error(`Cannot get error message from ${err}`)
    return
  }
  logger.error(`Crash detected, save to ${savePath}`)
  logger.error(`Please report to https://github.com/opq-osc/mahiro/issues`)
  writeFileSync(savePath, errorMsg, 'utf-8')
}
