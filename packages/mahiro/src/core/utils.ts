import dayjs from 'dayjs'
import lodash from 'lodash'
import chalk from 'mahiro/compiled/chalk'
import { consola } from 'consola'
import { z } from 'zod'
import qs from 'qs'
import axios from 'axios'
import WebSocket from 'ws'
import figlet from 'figlet'
import cron from 'node-cron'
import cronstrue from 'cronstrue'
import knex from 'knex'
import * as fileType from 'mahiro/compiled/file-type'
import fsExtra from 'fs-extra'

// keyv
import Keyv from '@keyvhq/core'
import KeyvSQLite from '@keyvhq/sqlite'
import KeyvRedis from '@keyvhq/redis'
import { isBase64 } from '../utils/base64'
import { saveCrashLog } from '../utils/crash'

export class Utils {
  // deps
  dayjs = dayjs
  lodash = lodash
  chalk = chalk
  consola = consola
  zod = z
  qs = qs
  axios = axios
  ws = WebSocket
  figlet = figlet
  cron = cron
  cronstrue = cronstrue
  knex = knex
  Keyv = Keyv
  KeyvSQLite = KeyvSQLite
  KeyvRedis = KeyvRedis
  fileType = fileType
  fsExtra = fsExtra

  // utils
  isBase64 = isBase64
  saveCrashLog = saveCrashLog
}
