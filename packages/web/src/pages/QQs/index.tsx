import { useQQsList } from '@/hooks/useQQsList'
import { useRobotServerInfo } from '@/hooks/useRobotServerInfo'
import { SyncOutlined } from '@ant-design/icons'
import {
  Alert,
  Button,
  Modal,
  Row,
  Space,
  Spin,
  Table,
  Tooltip,
  Typography,
  message,
} from 'antd'
import { ColumnsType } from 'antd/es/table'
import { useState } from 'react'
import { useHref, useNavigate } from 'react-router-dom'

export const QQs = () => {
  const query = useQQsList()
  const dataSource = (query?.data || []).map((i) => {
    return {
      account: i,
    }
  })

  const columns: ColumnsType<any> = [
    {
      title: '账号',
      dataIndex: 'account',
    },
  ]

  const groupUrl = useHref('../groups')
  const navigate = useNavigate()

  const [visible, setVisible] = useState(false)
  const { loading, getLoginQrcode } = useRobotServerInfo()
  const [qrcode, setQrcode] = useState<string>('')

  const refreshQrcode = async () => {
    const q = await getLoginQrcode()
    if (q?.length) {
      setQrcode(q)
    } else {
      message.error('获取失败')
    }
  }

  const openLoginModal = async () => {
    refreshQrcode()
    setVisible(true)
  }

  return (
    <div>
      <Row>
        <Typography.Title
          style={{
            marginTop: 0,
          }}
          level={4}
        >
          {`QQ管理（测试版）`}
        </Typography.Title>
      </Row>
      <Row style={{ padding: '5px 0 10px 0' }}>
        <Alert
          showIcon
          type="info"
          message={
            <Space
              style={{
                paddingRight: 5,
                paddingLeft: 5,
              }}
              size={5}
              direction="vertical"
            >
              <div>
                {`暂仅支持查看，`}
                <a
                  href={groupUrl}
                  onClick={(e) => {
                    e.preventDefault()
                    navigate('../groups')
                  }}
                >
                  群组
                </a>
                {` 必须配置账号后，该账号才会在指定的群组内生效`}
              </div>
              <div>
                还有账号没登录？
                <a
                  onClick={(e) => {
                    e.preventDefault()
                    openLoginModal()
                  }}
                >
                  点我
                </a>
                {' 扫码登录'}
              </div>
            </Space>
          }
        />
      </Row>
      <Table
        loading={query.isFetching}
        size="small"
        dataSource={dataSource}
        columns={columns}
        rowKey={(r) => r?.account}
        pagination={{
          hideOnSinglePage: true,
        }}
      />
      <Modal
        title="扫码登录"
        open={visible}
        onCancel={() => {
          setVisible(false)
        }}
        okButtonProps={{
          style: {
            display: 'none',
          },
        }}
        cancelText="关闭"
        destroyOnClose
      >
        <div
          style={{
            marginLeft: -10,
          }}
        >
          <Row justify="end">
            <Tooltip title="刷新">
              <Button
                onClick={() => {
                  refreshQrcode()
                }}
                size="small"
                loading={loading}
                icon={<SyncOutlined />}
              />
            </Tooltip>
          </Row>
          <Row justify="center">
            <Spin spinning={loading}>
              <img
                style={{
                  aspectRatio: '1/1',
                  width: '100%',
                }}
                src={qrcode}
              />
            </Spin>
          </Row>
        </div>
      </Modal>
    </div>
  )
}
