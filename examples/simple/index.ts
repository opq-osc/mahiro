import { Mahiro } from 'mahiro'

const run = async () => {
  const ins = new Mahiro({
    // host: `100.0.0.1`,
    qq: 12345678,
  })

  ins.onGroupMessage('plugin 1', async (data) => {
    if (data?.msg?.Content === 'Who am I?') {
      ins.sendGroupMessage({
        groupId: data.groupId,
        msg: {
          Content: 'Mahiro',
        },
      })
    }
  })

  ins.onFriendMessage('plugin 2', (data) => {
    if (data?.msg?.Content === 'Who am I?') {
      ins.sendFriendMessage({
        userId: data.userId,
        msg: {
          Content: 'Mahiro',
        },
      })
    }
  })
}

run()
