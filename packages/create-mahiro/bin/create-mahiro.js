#!/usr/bin/env node

require('../dist/index.js')
  .init()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
