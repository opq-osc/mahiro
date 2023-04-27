import { Mahiro } from 'mahiro'

const config = require('./.account.json')

const run = async () => {
  const mahiro = await Mahiro.start({
    host: config.host,
    port: config.port,
    qq: config.account,
  })

  mahiro.onGroupMessage('Hello world Group', async (data) => {
    if (data?.msg?.Content === 'Hello') {
      mahiro.sendGroupMessage({
        groupId: data.groupId,
        msg: {
          Content: 'Mahiro',
        },
      })
    }
  })

  mahiro.onFriendMessage('Hello world Friend', (data) => {
    if (data?.msg?.Content === 'Hello') {
      mahiro.sendFriendMessage({
        userId: data.userId,
        msg: {
          Content: 'Mahiro',
        },
      })
    }
  })
}

run()
