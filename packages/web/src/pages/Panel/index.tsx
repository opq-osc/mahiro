import { usePanel } from '@/hooks/usePanel'
import { Empty, Row, Spin, Tabs, Typography } from 'antd'

export const Panel = () => {
  const query = usePanel()

  return (
    <div>
      <Row
        style={{
          paddingBottom: 10,
        }}
      >
        <Typography.Title
          style={{
            marginTop: 0,
          }}
          level={4}
        >
          {`超级仪表盘（测试版）`}
        </Typography.Title>
      </Row>
      <Spin spinning={query.isFetching}>
        {!query?.data?.length ? (
          <Empty description="您未注册任何仪表盘" />
        ) : (
          <Tabs
            tabPosition="left"
            type="card"
            style={{
              border: '1px solid #e8e8e8',
              borderRadius: 8,
            }}
            destroyInactiveTabPane
            items={query.data.map((i) => {
              return {
                label: i.name,
                key: i.name,
                children: (
                  <div
                    style={{
                      // height: '100%',
                      overflow: 'auto',
                      minHeight: '70vh',
                      padding: '15px 5px',
                    }}
                  >
                    <div
                      dangerouslySetInnerHTML={{
                        __html: i.content,
                      }}
                    />
                  </div>
                ),
              }
            })}
          />
        )}
      </Spin>
    </div>
  )
}
