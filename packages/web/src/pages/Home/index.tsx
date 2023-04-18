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
              {`填写 MAHIRO_AUTH_TOKEN 才能使用面板，默认为主账号，运行时指定 MAHIRO_AUTH_TOKEN=xxx 可以自定义`}
            </div>
          }
        />
      </Space>
    </Box>
  )
}
