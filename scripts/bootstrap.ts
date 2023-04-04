import 'zx/globals'

const run = async () => {
  // init submodules
  await $`submodule:init`

  // delete botoy entry
  // Why? Because we don't use botoy, but __init__.py will auto loaded
  // If you installed botoy, you can also not delete it
  const botoyEntry = path.join(
    __dirname,
    '../python/plugins/chinchin_pk/__init__.py'
  )
  if (fs.existsSync(botoyEntry)) {
    fs.removeSync(botoyEntry)
  }
}

run()
