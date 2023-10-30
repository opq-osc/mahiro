# @xn-sakina/mahiro-filter

### Install

```bash
  pnpm i -D @xn-sakina/mahiro-filter
```

### Usage

```ts
import { MahiroFilter } from '@xn-sakina/mahiro-filter'
import path from 'path'

mahiro.use(MahiroFilter({
  // sensitive words data file path
  dataPath: path.join(__dirname, './data.txt')
}))
```

### More info

See [mahiro](https://github.com/opq-osc/mahiro) for more infomation.
