import {
  Typography,
  Row,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  message,
  Table,
  Select,
  Spin,
  Popconfirm,
  Tooltip,
} from 'antd'
import { useEffect, useState } from 'react'
import { trim, isNumber, cloneDeep } from 'lodash'
import { ColumnType } from 'antd/es/table'
import { useGroupsList } from '@/hooks/useGroupsList'
import { numberListValidator } from '@/utils/validator'
import { PluginsSelect } from '@/components/PluginsSelect'
import { useMutation } from '@tanstack/react-query'
import { IGroup, addGroup, deleteGroup, updateGroup } from '@/services/groups'
import { ListView } from '../Plugins'
import dayjs from 'dayjs'
import { toNumberFromArray } from '@/utils'
import { QQsSelect } from '@/components/QQsSelect'
import { useQQsList } from '@/hooks/useQQsList'

export const Groups = () => {
  const [addVisible, setAddVisible] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editData, setEditData] = useState<IGroup>()

  const query = useGroupsList()

  const onAddGroup = () => {
    setIsEdit(false)
    setAddVisible(true)
  }

  const deleteMutation = useMutation({
    mutationFn: deleteGroup,
  })

  const onDelete = async (id: number) => {
    const res = await deleteMutation.mutateAsync(id)
    if (res?.code === 200) {
      message.success('删除成功')
      query.refetch()
    } else {
      message.error('删除失败')
    }
  }

  const qqsQuery = useQQsList()

  const columns: ColumnType<any>[] = [
    {
      title: '群组名称',
      dataIndex: 'name',
      width: 170,
    },
    {
      title: '群号',
      dataIndex: 'group_id',
      width: 120,
    },
    {
      title: '管理员',
      dataIndex: 'admins',
      width: 160,
      render: (col) => {
        return <ListView value={col} />
      },
    },
    {
      title: '过期时间',
      dataIndex: 'expired_at',
      width: 180,
      render: (col) => {
        const ins = dayjs(col)
        const nowIns = dayjs()
        const isExpired = ins.isBefore(nowIns)
        const span = (
          <span
            style={{
              color: isExpired ? 'rgba(0, 0, 0, .6)' : undefined,
            }}
          >
            {col}
          </span>
        )
        return (
          <Tooltip title="已过期" open={isExpired ? undefined : false}>
            {isExpired ? <del>{span}</del> : span}
          </Tooltip>
        )
      },
    },
    {
      title: '绑定账号',
      dataIndex: 'link_qqs',
      width: 160,
      render: (col: number[]) => {
        const qqs = col || []
        const currentUsingQQs = qqsQuery.data?.map(i => i.qq) || []
        const filteredQQs: number[] = qqs.filter((i) => {
          return currentUsingQQs.includes(i)
        })
        return <ListView value={filteredQQs} />
      },
    },
    {
      title: '可用插件',
      dataIndex: 'plugins',
      render: (col) => {
        return <PluginsSelect preview value={col || []} />
      },
    },
    {
      title: '操作',
      dataIndex: 'action',
      fixed: 'right',
      width: 120,
      render: (_, row) => {
        const id = row?.id
        return (
          <Space>
            <Button
              size="small"
              onClick={() => {
                setIsEdit(true)
                // set edit data
                const newEditData = cloneDeep(row)
                newEditData.expired_at = dayjs(newEditData.expired_at)
                setEditData(newEditData)
                // open modal
                setAddVisible(true)
              }}
              disabled={deleteMutation.isLoading}
            >
              编辑
            </Button>
            <Popconfirm
              title="确认删除？"
              onConfirm={() => {
                onDelete(id)
              }}
              okButtonProps={{
                loading: deleteMutation.isLoading,
              }}
              cancelButtonProps={{
                disabled: deleteMutation.isLoading,
              }}
            >
              <Button
                disabled={deleteMutation.isLoading}
                danger
                type="text"
                size="small"
              >
                删除
              </Button>
            </Popconfirm>
          </Space>
        )
      },
    },
  ]

  return (
    <div>
      <Row>
        <Typography.Title
          style={{
            marginTop: 0,
          }}
          level={4}
        >
          群组管理
        </Typography.Title>
      </Row>
      <Row justify="end" style={{ paddingBottom: 20 }}>
        <Space>
          <Button
            disabled={deleteMutation.isLoading}
            type="primary"
            onClick={onAddGroup}
          >
            添加群组
          </Button>
        </Space>
      </Row>
      <Table
        scroll={{ x: 1300 }}
        loading={query.isFetching}
        dataSource={query?.data || []}
        columns={columns}
        rowKey={(r) => r?.id}
        pagination={{
          hideOnSinglePage: true,
        }}
      />
      <AddModal
        editMode={isEdit}
        initialData={editData}
        visible={addVisible}
        setVisible={setAddVisible}
        refetch={query.refetch}
      />
    </div>
  )
}

function AddModal({
  setVisible,
  visible,
  refetch,
  editMode = false,
  initialData,
}: {
  setVisible: (visible: boolean) => void
  visible: boolean
  refetch?: () => void
  editMode?: boolean
  initialData?: IGroup
}) {
  const [form] = Form.useForm()

  const onClose = () => {
    form.resetFields()
    setVisible(false)
  }

  const addMutation = useMutation({
    mutationFn: addGroup,
  })
  const updateMutation = useMutation({
    mutationFn: updateGroup,
  })

  const onAdd = async () => {
    try {
      const values = await form.validateFields()
      if (!trim(values?.name)?.length) {
        return message.error('群组名称不能为空')
      }
      if (!isNumber(values?.group_id)) {
        return message.error('群号必须为数字')
      }
      if (!values?.expired_at) {
        return message.error('过期时间不能为空')
      }
      values.expired_at = values.expired_at.format('YYYY-MM-DD HH:mm:ss')
      // number ify admins, plugins
      values.admins = toNumberFromArray(values.admins)
      values.plugins = toNumberFromArray(values.plugins)
      // call api
      const apiImpl = editMode
        ? updateMutation.mutateAsync
        : addMutation.mutateAsync
      const res = await apiImpl(values)
      if (res?.code === 200) {
        if (editMode) {
          message.success('添加成功')
        } else {
          message.success('编辑成功')
        }
        onClose()
        // refetch query
        refetch?.()
      } else {
        message.error(`操作失败，请重试`)
      }
    } catch {
      message.error('请检查输入')
    }
  }

  useEffect(() => {
    if (editMode && initialData) {
      form.setFieldsValue(initialData)
    }
  }, [initialData, editMode])

  return (
    <Modal
      open={visible}
      title={editMode ? '编辑群组' : '添加群组'}
      onOk={onAdd}
      okText={editMode ? '保存' : '创建'}
      cancelText="关闭"
      keyboard={false}
      destroyOnClose
      onCancel={() => {
        onClose()
      }}
      okButtonProps={{
        loading: addMutation.isLoading,
      }}
      cancelButtonProps={{
        disabled: addMutation.isLoading,
      }}
      closable={!addMutation.isLoading}
    >
      <Spin spinning={addMutation.isLoading}>
        <Form
          labelAlign="right"
          labelCol={{
            span: 4,
          }}
          form={form}
        >
          <Typography.Title
            style={{
              marginTop: 0,
            }}
            level={5}
          >
            {`☕️ 基本选项`}
          </Typography.Title>
          <Form.Item name="id" noStyle>
            <Input
              style={{
                display: 'none',
              }}
            />
          </Form.Item>
          <Form.Item
            name="name"
            label="群组名称"
            extra={<div>这是一个群组的备注，可以任意填写关键信息</div>}
            required
          >
            <Input />
          </Form.Item>
          <Form.Item name="group_id" label="群号" required>
            <InputNumber min={0} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="expired_at" label="过期时间" required>
            <DatePicker showTime />
          </Form.Item>
          <Form.Item
            name="link_qqs"
            label="绑定账号"
            extra={
              <div>
                注意必须绑定账号，对应的账号才在该群生效；多账号在一个群时，建议只开启一个账号
              </div>
            }
            initialValue={[]}
          >
            <QQsSelect />
          </Form.Item>
          <Form.Item
            label="可用插件"
            name="plugins"
            extra="可以后面再慢慢添加"
            initialValue={[]}
          >
            <PluginsSelect />
          </Form.Item>
          <Typography.Title level={5}>{`🤔 高级选项`}</Typography.Title>
          <Form.Item
            name="admins"
            label="管理员"
            extra="某个群的管理员，可以用命令 .close 插件名  / .open 插件名 来关闭或开启任何在后台面板里启用的插件"
            rules={[numberListValidator]}
            initialValue={[]}
          >
            <Select placeholder="请输入用户号码" allowClear mode="tags" />
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  )
}
