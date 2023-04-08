# Mahiro

**Mahiro** is a JavaScript SDK for OPQBot.

```bash
      ___           ___           ___                       ___           ___
     /__/\         /  /\         /__/\        ___          /  /\         /  /\
    |  |::\       /  /::\        \  \:\      /  /\        /  /::\       /  /::\
    |  |:|:\     /  /:/\:\        \__\:\    /  /:/       /  /:/\:\     /  /:/\:\
  __|__|:|\:\   /  /:/~/::\   ___ /  /::\  /__/::\      /  /:/~/:/    /  /:/  \:\
 /__/::::| \:\ /__/:/ /:/\:\ /__/\  /:/\:\ \__\/\:\__  /__/:/ /:/___ /__/:/ \__\:\
 \  \:\~~\__\/ \  \:\/:/__\/ \  \:\/:/__\/    \  \:\/\ \  \:\/:::::/ \  \:\ /  /:/
  \  \:\        \  \::/       \  \::/          \__\::/  \  \::/~~~~   \  \:\  /:/
   \  \:\        \  \:\        \  \:\          /__/:/    \  \:\        \  \:\/:/
    \  \:\        \  \:\        \  \:\         \__\/      \  \:\        \  \::/
     \__\/         \__\/         \__\/                     \__\/         \__\/

ℹ Try connect...
ℹ Register onGroupMessage:  plugin 1
ℹ Register onFriendMessage:  plugin 2
✔ WS Connected ws://127.0.0.1:8086/ws
```

### Install

```bash
  pnpm add -D mahiro
```

### Usage

```ts
import { Mahiro } from 'mahiro'

const run = async () => {
  const ins = await Mahiro.start({
    host: `100.0.0.1`,
    port: 8086,
    qq: 123456788,
  })

  ins.onGroupMessage('plugin 1', async (data) => {
    if (data?.msg?.Content === 'Who I am') {
      await ins.sendGroupMessage({
        groupId: data.groupId,
        msg: {
          Content: 'Mahiro',
        },
      })
    }
  })
}

run()
```

### License

MIT
