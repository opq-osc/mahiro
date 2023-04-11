import { useQQsList } from '@/hooks/useQQsList'
import { Alert, Row, Table, Typography } from 'antd'
import { ColumnsType } from 'antd/es/table'
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
            <div>
              暂仅支持查看，
              <a
                href={groupUrl}
                onClick={(e) => {
                  e.preventDefault()
                  navigate('../groups')
                }}
              >
                群组
              </a>
              必须配置账号后，该账号才会在指定的群组内生效
            </div>
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
    </div>
  )
}
