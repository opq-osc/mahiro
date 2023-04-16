import { Alert, Form, Input, Space } from 'antd'
import { useState } from 'react'
import styled from 'styled-components'

const Box = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
`

export const Home = () => {
  const [token, setToken] = useState(
    localStorage.getItem('MAHIRO_AUTH_TOKEN') || '',
  )

  return (
    <Box>
      <Space align="center" direction="vertical">
        <Form>
          <Form.Item label="MAHIRO_AUTH_TOKEN">
            <Input
              style={{
                width: 250,
              }}
              placeholder="MAHIRO_AUTH_TOKEN"
              value={token}
              onChange={(e) => {
                const nv = e.target.value
                setToken(nv)
                localStorage.setItem('MAHIRO_AUTH_TOKEN', nv)
              }}
            />
          </Form.Item>
        </Form>
        <Alert
          type="warning"
          showIcon
          message={
            <div
              style={{
                maxWidth: 400,
              }}
            >
              设定 MAHIRO_AUTH_TOKEN=xxx 来启动 mahiro
              可以限制面板接口访问权限，此处填写相同值即可，否则请及时关闭面板端口，防止外部渗透
            </div>
          }
        />
      </Space>
    </Box>
  )
}
