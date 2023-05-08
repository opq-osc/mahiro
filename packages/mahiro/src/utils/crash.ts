import { consola } from 'consola'
import { existsSync, mkdirSync, statSync, writeFileSync } from 'fs'
import { join } from 'path'

const logger = consola.withTag('crash') as typeof consola

export const saveCrashLog = (err: any) => {
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
