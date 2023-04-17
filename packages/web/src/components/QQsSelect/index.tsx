import { useQQsList } from '@/hooks/useQQsList'
import { randomColor } from '@/utils/color'
import { Select, SelectProps, Tag } from 'antd'

export interface IQQsSelectProps extends SelectProps {
  value?: number[]
  onChange?: (value: number[]) => void
}

export const QQsSelect = ({
  value,
  onChange,
  ...props
}: IQQsSelectProps) => {
  const { data: originData, isFetching } = useQQsList()
  const data = originData?.map(i => i.qq)
  const options = (data || []).map((i) => {
    const color = randomColor(i)
    return {
      label: (
        <Tag
          style={{
            display: 'inline-flex',
            alignItems: 'center',
          }}
          color={color}
        >
          {i}
        </Tag>
      ),
      value: i,
    }
  })

  const filteredValue = value?.filter((i) => {
    return options?.some(o => o?.value === i)
  })

  return (
    <Select
      options={options}
      loading={isFetching}
      showSearch
      mode="multiple"
      allowClear
      placeholder="请绑定账号"
      value={filteredValue}
      onChange={onChange}
      {...props}
    />
  )
}
