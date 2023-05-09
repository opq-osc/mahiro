#!/usr/bin/env node

const cmd = process.argv[2]
if (cmd === 'clean') {
  require('../dist/commands/clean')
    .clean()
    .then(() => {
      process.exit(0)
    })
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
} else {
  import('tsx/cli')
}
