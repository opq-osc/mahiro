import {
  Typography,
  Row,
  Button,
  Space,
  Modal,
  Form,
  Input,
  message,
  Table,
  Tag,
  Popover,
  Switch,
  Tooltip,
  Select,
  Spin,
} from 'antd'
import { useState } from 'react'
import { ColumnType } from 'antd/es/table'
import { usePluginsList } from '@/hooks/usePluginsList'
import { useMutation } from '@tanstack/react-query'
import { updatePlugin } from '@/services/plugins'
import { Text } from '@/components/Text'
import { toNumberFromArray } from '@/utils'
import { numberListValidator } from '@/utils/validator'

export const Plugins = () => {
  const [visible, setVisible] = useState(false)
  const [form] = Form.useForm()

  const query = usePluginsList()

  const columns: ColumnType<any>[] = [
    {
      title: '插件名称',
      dataIndex: 'name',
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      render: (col, row) => {
        const isInternal = row?.internal
        if (isInternal) {
          return <Tag color="blue">内置</Tag>
        }
        if (col) {
          return <Tag color="green">开启</Tag>
        } else {
          return <Tag>关闭</Tag>
        }
      },
    },
    {
      title: '白名单用户',
      dataIndex: 'white_list_users',
      render: (col: number[]) => {
        return <ListView value={col} />
      },
    },
    {
      title: '黑名单用户',
      dataIndex: 'black_list_users',
      render: (col: number[]) => {
        return <ListView value={col} />
      },
    },
    // TODO
    // {
    //   title: '阈值',
    //   dataIndex: 'threshold'
    // },
    {
      title: '操作',
      dataIndex: 'action',
      render: (_, row) => {
        const isInternal = row?.internal
        return (
          <Space>
            <Tooltip
              open={isInternal ? undefined : false}
              title="内部插件不可以修改"
            >
              <Button
                disabled={isInternal}
                size="small"
                onClick={() => {
                  // set data
                  form.setFieldsValue(row)
                  // open modal
                  setVisible(true)
                }}
              >
                编辑
              </Button>
            </Tooltip>
          </Space>
        )
      },
    },
  ]

  const onCloseModal = () => {
    // clear form data
    form.resetFields()
    // close modal
    setVisible(false)
  }

  const editMutation = useMutation({
    mutationFn: updatePlugin,
  })

  const onEdit = async () => {
    try {
      const data = await form.validateFields()
      const res = await editMutation.mutateAsync({
        id: data.id,
        enabled: data.enabled,
        white_list_users: toNumberFromArray(data.white_list_users),
        black_list_users: toNumberFromArray(data.black_list_users),
      })
      if (res?.code === 200) {
        message.success(`修改成功`)
        onCloseModal()
        // refetch
        query.refetch()
      } else {
        message.error(`修改失败，请重试`)
      }
    } catch {
      message.error('请检查表单')
    }
  }

  return (
    <div>
      <Row>
        <Typography.Title
          style={{
            marginTop: 0,
            paddingBottom: 20,
          }}
          level={4}
        >
          插件管理
        </Typography.Title>
      </Row>
      <Table
        loading={query.isFetching}
        size="small"
        rowKey={(r) => r?.id}
        dataSource={query.data || []}
        columns={columns}
        pagination={{
          hideOnSinglePage: true,
        }}
      />
      <Modal
        title="编辑插件"
        open={visible}
        onCancel={() => {
          onCloseModal()
        }}
        closable={!editMutation.isLoading}
        keyboard={false}
        onOk={onEdit}
        okButtonProps={{
          loading: editMutation.isLoading,
        }}
        cancelButtonProps={{
          disabled: editMutation.isLoading,
        }}
        okText="保存"
        cancelText="关闭"
      >
        <Spin spinning={editMutation.isLoading}>
          <Form
            labelAlign="right"
            labelCol={{
              span: 4,
            }}
            form={form}
          >
            <Form.Item noStyle name="id">
              <Input
                style={{
                  display: 'none',
                }}
              />
            </Form.Item>
            <Form.Item name="name" label="插件名称">
              <Text />
            </Form.Item>
            <Form.Item name="enabled" label="状态" valuePropName="checked">
              <Switch checkedChildren="开启" unCheckedChildren="关闭" />
            </Form.Item>
            <Form.Item
              name="threshold"
              label="阈值"
              extra="预告功能，下个版本做"
            >
              <Text />
            </Form.Item>
            <Form.Item
              name="white_list_users"
              label="白名单用户"
              extra="白名单用户是特权用户，即使某个群关闭了该插件，该用户也可以使用，一般用于 vip 的情况"
              rules={[numberListValidator]}
            >
              <Select allowClear mode="tags" placeholder="请输入用户号码" />
            </Form.Item>
            <Form.Item
              name="black_list_users"
              label="黑名单用户"
              extra="被屏蔽了的用户在任何场合下都不能使用此插件的功能"
              rules={[numberListValidator]}
            >
              <Select allowClear mode="tags" placeholder="请输入用户号码" />
            </Form.Item>
          </Form>
        </Spin>
      </Modal>
    </div>
  )
}

export function ListView({ value = [] }: { value?: number[] }) {
  if (!value?.length) {
    return <div>-</div>
  }
  const label = `${value[0]} 等 ${value.length} 人`
  return (
    <div>
      <Popover
        placement="bottom"
        content={
          <div
            style={{
              maxHeight: 200,
              overflow: 'auto',
            }}
          >
            <Space direction="vertical">
              {value.map((item) => (
                <div key={item}>{item}</div>
              ))}
            </Space>
          </div>
        }
      >
        {label}
      </Popover>
    </div>
  )
}
