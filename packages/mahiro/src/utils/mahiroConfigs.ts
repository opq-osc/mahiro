import { join } from 'path'

export interface IMahiroConfigs {
  requiredPythonMahiroVersion: string
}

export const getMahiroConfigs = () => {
  const pkgFile = join(__dirname, '../../package.json')
  const pkg = require(pkgFile)
  return pkg.mahiroConfigs as IMahiroConfigs
}
