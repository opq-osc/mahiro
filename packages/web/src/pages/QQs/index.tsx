import { useQQsList } from '@/hooks/useQQsList'
import { SyncOutlined } from '@ant-design/icons'
import {
  Alert,
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd'
import { ColumnsType } from 'antd/es/table'
import { isEmpty, isNumber } from 'lodash'
import { useState } from 'react'
import { useHref, useNavigate } from 'react-router-dom'
import { SafeImage } from './SafeImage'
import qs from 'qs'
import { ILoginReq, getQrcode } from '@/services/login'
import { useMutation } from '@tanstack/react-query'

export const QQs = () => {
  const query = useQQsList()
  const dataSource = query?.data || []

  const columns: ColumnsType<any> = [
    {
      title: '账号',
      dataIndex: 'qq',
    },
    {
      title: '分布',
      dataIndex: 'local',
      render: (col) => {
        return (
          <Tooltip title="本地指服务与OPQ都在一起，远程指不在一个服务上">
            <Tag color={col ? undefined : 'green'}>{col ? '本地' : '远程'}</Tag>
          </Tooltip>
        )
      },
    },
    {
      title: '定位',
      dataIndex: 'side',
      render: (col) => {
        return (
          <Tooltip title="主账号只有一个，其他全是伴生账号">
            <Tag color={col ? 'yellow' : 'red'}>{col ? '边缘' : '主账号'}</Tag>
          </Tooltip>
        )
      },
    },
    {
      title: '层',
      dataIndex: 'external',
      render: (col) => {
        return (
          <Tooltip title="内部指一机多账号，外部指多机多账号">
            <Tag color={col ? 'blue' : 'orange'}>{col ? '外部' : '内部'}</Tag>
          </Tooltip>
        )
      },
    },
  ]

  const groupUrl = useHref('../groups')
  const navigate = useNavigate()

  const [visible, setVisible] = useState(false)

  const [reuseQQ, setReuseQQ] = useState<number>()
  const [deviceInfo, setDeviceInfo] = useState<string>()
  const [qrcode, setQrcode] = useState<string>()

  const qrcodeMutation = useMutation({
    mutationFn: getQrcode,
  })

  const refreshQrcode = async () => {
    const params: ILoginReq = {}
    if (isNumber(reuseQQ)) {
      params.qq = reuseQQ
    }
    if (deviceInfo?.length) {
      params.devicename = deviceInfo
    }
    const queryString = isEmpty(params) ? '' : qs.stringify(params)
    const result = await qrcodeMutation.mutateAsync({
      query: queryString,
    })
    if (result?.length) {
      setQrcode(result)
      const extraLabel = `${
        params?.qq ? `指定账号：${params.qq}` : '未指定该账号'
      }, ${
        params?.devicename
          ? `指定设备信息：${params?.devicename}`
          : '未指定设备信息'
      }`
      message.success(`获取成功 ( ${extraLabel} )`)
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
          {`账号管理（测试版）`}
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
        rowKey={(r) => r?.qq}
        pagination={{
          hideOnSinglePage: true,
        }}
      />
      <Modal
        title="扫码登录"
        open={visible}
        onCancel={() => {
          setVisible(false)
          // clear input data
          setReuseQQ(undefined)
          setDeviceInfo(undefined)
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
                loading={qrcodeMutation.isLoading}
                icon={<SyncOutlined />}
              />
            </Tooltip>
          </Row>
          <Row justify="center">
            <Spin spinning={qrcodeMutation.isLoading}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexDirection: 'column',
                }}
              >
                <Form
                  labelCol={{
                    span: 6,
                  }}
                  wrapperCol={{
                    style: {
                      textAlign: 'center',
                    }
                  }}
                >
                  <Form.Item label="账号">
                    <InputNumber
                      min={0}
                      precision={0}
                      placeholder="请输入账号"
                      value={reuseQQ}
                      onChange={(nv) => {
                        setReuseQQ(nv as any)
                      }}
                      style={{ width: 250 }}
                    />
                  </Form.Item>
                  <Form.Item label="设备信息">
                    <Input
                      placeholder="指定设备信息，可不填写"
                      value={deviceInfo}
                      onChange={(e) => {
                        setDeviceInfo(e.target.value)
                      }}
                      style={{ width: 250 }}
                    />
                  </Form.Item>
                </Form>
                <Row
                  style={{
                    paddingBottom: 20,
                  }}
                  justify="center"
                >
                  <SafeImage
                    style={{
                      aspectRatio: '1/1',
                    }}
                    width={180}
                    height={180}
                    src={qrcode}
                  />
                </Row>
              </div>
            </Spin>
          </Row>
          <Row
            style={{
              padding: '0 10px',
            }}
          >
            <Alert
              showIcon
              message={
                <Space direction="vertical">
                  <div>
                    注：过期重登录时，若想复用上次的设备信息，请填写账号后重新刷新登录二维码，若不填写默认随机新设备登录
                  </div>
                  <div>{`    如想自定义设备信息，请自行填写`}</div>
                </Space>
              }
            />
          </Row>
        </div>
      </Modal>
    </div>
  )
}
