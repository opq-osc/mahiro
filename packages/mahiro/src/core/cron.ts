import nodeCron from 'node-cron'
import cronstrue from 'cronstrue'
import { consola } from 'consola'
import 'cronstrue/locales/zh_CN'

export class CronJob {
  logger = consola.withTag('cron-job') as typeof consola

  tasks: nodeCron.ScheduledTask[] = []

  constructor() {}

  registerCronJob(cron: string, callback: () => void) {
    const isValid = nodeCron.validate(cron)
    if (!isValid) {
      this.logger.error(`[CronJob] Invalid cron: ${cron}`)
      return
    }
    const readableCron = cronstrue.toString(cron, { locale: 'zh_CN' })
    this.logger.info(
      `[CronJob] Registering cron job with cron: ${cron} (${readableCron})`,
    )
    const task = nodeCron.schedule(cron, callback, {
      timezone: 'Asia/Shanghai',
      scheduled: false,
    })
    this.tasks.push(task)
    task.start()
    return () => {
      this.logger.info(
        `[CronJob] Removing cron job with cron: ${cron} (${readableCron})`,
      )
      task.stop()
    }
  }
}
