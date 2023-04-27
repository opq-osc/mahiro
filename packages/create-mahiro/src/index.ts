import { program } from 'commander'
import {
  intro,
  isCancel,
  outro,
  select,
} from 'create-mahiro/compiled/@clack/prompts'
import chalk from 'create-mahiro/compiled/chalk'
import {
  copyFileSync,
  existsSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'fs'
import { basename, dirname, join, relative } from 'path'
import { logger } from './logger'
import { mkdir, readdir } from 'fs/promises'
import Mustache from 'mustache'

const pkg = require('../package.json')
const TEMPLATE_DIR = join(__dirname, '../templates')

enum EProjectType {
  simple = 'simple',
  // docker = 'docker',
}

export const init = async () => {
  const checkExit = (v: any) => {
    if (isCancel(v)) {
      outro('Exit')
      process.exit(0)
    }
  }

  const cwd = process.cwd()
  program
    .argument('[name]', 'project dir name', 'my-mahiro')
    .action(async (name) => {
      intro(`${chalk.bold.blue('Mahiro')} v${pkg.version}`)

      const target = join(cwd, name)
      if (existsSync(target)) {
        logger.warn(`Directory ${chalk.yellow(name)} already exists.`)
        return
      }

      // select project type
      const projectType = await select({
        message: 'Pick a project type.',
        options: [
          {
            value: EProjectType.simple,
            label: 'Simple',
            hint: `A simple easy mahiro project.`,
          },
        ],
      })
      checkExit(projectType)

      if (projectType === EProjectType.simple) {
        logger.info(`Creating...`)
        // copy dir
        const from = join(TEMPLATE_DIR, EProjectType.simple)
        try {
          await copyDir(from, target)
          logger.success(`Project ${chalk.green(basename(target))} created.`)
          outro(chalk.green('🎉 You are all set!'))
          quickStartTip(target)
        } catch (e) {
          logger.error(e)
          return
        }
      }
    })

  program.version(pkg.version)
  program.parse(process.argv)
}

async function copyDir(from: string, target: string) {
  if (!existsSync(target)) {
    await mkdir(target, { recursive: true })
  }

  const files = await readdir(from)
  files.forEach((file) => {
    const absPath = join(from, file)
    let targetPath = join(target, file)
    const isDir = statSync(absPath).isDirectory()
    // dir
    if (isDir) {
      copyDir(absPath, targetPath)
      return
    }
    // file
    // check tpl file
    const isTpl = file.endsWith('.tpl')
    if (isTpl) {
      targetPath = targetPath.replace(/\.tpl$/, '')
    }
    if (!existsSync(targetPath)) {
      if (isTpl) {
        const originContent = readFileSync(absPath, 'utf-8')
        const output = Mustache.render(originContent, {
          version: `^${pkg.version}`,
        })
        writeFileSync(targetPath, output)
      } else {
        copyFileSync(absPath, targetPath)
      }
    } else {
      logger.warn(
        `File ${chalk.yellow(getReadablePath(targetPath))} already exists.`,
      )
    }
  })
}

function getReadablePath(s: string) {
  return `${basename(dirname(s))}/${basename(s)}`
}

function quickStartTip(target: string) {
  console.log(chalk.magenta('Quick Start:'))
  console.log()
  // install deps tip
  console.log(`1. ${chalk.bold('Install dependencies:')}`)
  console.log(`   ${chalk.cyan(`cd ${relative(process.cwd(), target)}`)}`)
  console.log(`   ${chalk.cyan('pnpm i')}`)
  console.log()
  // config
  console.log(`2. ${chalk.bold('Config the mahiro app:')}`)
  const configFile = '.account.json'
  console.log(`   ${chalk.cyan(`${configFile}`)}`)
  console.log()
  // run
  console.log(`3. ${chalk.bold('Run the mahiro app:')}`)
  console.log(`   ${chalk.cyan('pnpm start')}`)
  console.log()
}
