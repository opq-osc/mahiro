import { defineConfig } from '@xn-sakina/meta'

export default defineConfig({
  compile: 'swc',
  cssMinify: 'parcelCss',
  jsMinify: 'esbuild',
  title: 'Mahiro 管理面板'
})
