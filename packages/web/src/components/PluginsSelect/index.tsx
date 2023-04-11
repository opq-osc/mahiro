import { usePluginsList } from '@/hooks/usePluginsList'
import { Select, SelectProps, Space, Tag } from 'antd'
import { Fragment, useMemo } from 'react'
import { toString } from 'lodash'
import { randomColor } from '@/utils/color'

export interface IPluginsSelectProps extends SelectProps {
  value?: string[]
  onChange?: (value: string[]) => void
  preview?: boolean
}

export const PluginsSelect = ({
  value,
  onChange,
  preview = false,
  ...props
}: IPluginsSelectProps) => {
  const { data, isFetching } = usePluginsList({ cache: true })
  const options = useMemo(() => {
    return (data || [])
      ?.filter((o) => {
        return !o?.internal
      })
      .map((i) => {
        const color = randomColor(i?.id)
        return {
          label: (
            <Tag
              color={color}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              {i?.name}
            </Tag>
          ),
          value: i?.id,
        }
      })
  }, [data])

  if (preview) {
    if (!value?.length) {
      return <span>-</span>
    }
    const stringifyValue = value.map((i) => toString(i))
    const opts = options?.filter((i) => {
      return stringifyValue?.includes(toString(i?.value))
    })
    if (opts?.length === 0) {
      return <span>-</span>
    }
    return (
      <Space>
        {opts.map((i) => {
          return <Fragment key={i.value}>{i.label}</Fragment>
        })}
      </Space>
    )
  }

  const filteredValue = value?.filter((i) => {
    // cannot select internal plugin
    // must be in options
    const isExist = options?.find((o) => toString(o?.value) === toString(i))
    return isExist
  })

  return (
    <Select
      options={options}
      loading={isFetching}
      showSearch
      mode="multiple"
      allowClear
      placeholder="请选择插件"
      value={filteredValue}
      onChange={onChange}
      {...props}
    />
  )
}
