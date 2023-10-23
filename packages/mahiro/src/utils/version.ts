import { join } from 'path'

export interface IVersion {
  mahiro: string
}

export const getVersionInfo = () => {
  const pkgPath = join(__dirname, '../../package.json')
  const pkg = require(pkgPath)
  const mahiroVersion = pkg.version
  const info: IVersion = {
    mahiro: mahiroVersion,
  }
  return info
}
