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
import fileType from 'mahiro/compiled/file-type'
import isBase64 from 'is-base64'

// keyv
import Keyv from '@keyvhq/core'
import KeyvSQLite from '@keyvhq/sqlite'
import KeyvRedis from '@keyvhq/redis'

export class Utils {
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
  isBase64 = isBase64
}
