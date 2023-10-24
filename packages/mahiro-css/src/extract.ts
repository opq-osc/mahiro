import postcss from 'postcss'
import tailwind, { type Config as TailwindConfig } from 'tailwindcss'
import deepmerge from 'deepmerge'

export const extract = async (opts: {
  css: string
  code: string
  config?: TailwindConfig
}) => {
  const { code, css, config = {} } = opts

  const tailwindConfig: TailwindConfig = deepmerge(
    {
      content: [
        {
          raw: code,
        },
      ],
      theme: {
        extend: {},
      },
      plugins: [],
    },
    config,
  )

  const result = await postcss([tailwind(tailwindConfig)]).process(css, {
    map: false,
    from: 'tailwind.css',
  })

  return {
    css: result.css,
  }
}
