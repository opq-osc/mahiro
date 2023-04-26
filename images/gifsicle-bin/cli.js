#!/usr/bin/env node
const execa = require('execa')
const m = require('.')

execa(m, process.argv.slice(2), { stdio: 'inherit' })
