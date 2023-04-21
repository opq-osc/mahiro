import 'zx/globals'

const run = async () => {
  await $`rm -rf ./dist`
  await $`rm -rf ./build`
  await $`rm -rf ./mahiro.egg-info`

  await $`python3 ./setup.py sdist bdist_wheel`

  const json = fs.readJsonSync(path.join(__dirname, '../../.pypi.json'))
  const { username, password } = json
  await $`twine upload dist/* -u ${username} -p ${password}`
}

run()
