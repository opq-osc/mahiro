import { ConfigProvider, Layout as AntdLayout, Menu } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { EMenu, menus } from './options'
import {
  HomeOutlined,
  FireOutlined,
  UsergroupAddOutlined,
} from '@ant-design/icons'
import { useCallback } from 'react'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnMount: false,
    },
  },
})

const Logo = styled.div`
  color: #b080fe;
  font-size: 24px;
  font-weight: 600;
  padding: 15px 10px;
  text-align: center;
  border-inline-end: 1px solid rgba(5, 5, 5, 0.06);
`

export const Layout = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const getDefaultSelectedKeys = useCallback(() => {
    const pathname = location.pathname
    const mached = menus.find((m) => {
      if (pathname.startsWith(`/${m}`)) {
        return true
      }
    })
    return mached ? [mached] : [EMenu.home]
  }, [location.pathname])

  const changePath = useCallback((p: string) => {
    navigate(p)
  }, [])

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#B080FE',
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <AntdLayout
          style={{
            height: '100vh',
          }}
        >
          <AntdLayout.Sider theme="light" trigger={null} collapsible>
            <Logo>Mahiro</Logo>
            <Menu
              style={{
                height: '100%',
              }}
              mode="inline"
              defaultSelectedKeys={getDefaultSelectedKeys()}
              onClick={(e) => {
                changePath(`/${e.key}`)
              }}
              items={[
                {
                  key: EMenu.home,
                  icon: <HomeOutlined />,
                  label: '首页',
                },
                {
                  key: EMenu.plugins,
                  icon: <FireOutlined />,
                  label: '插件管理',
                },
                {
                  key: EMenu.groups,
                  icon: <UsergroupAddOutlined />,
                  label: '群组管理',
                },
              ]}
            />
          </AntdLayout.Sider>
          <AntdLayout className="site-layout">
            <AntdLayout.Content
              style={{
                background: '#fff',
                padding: 24,
              }}
            >
              <Outlet />
            </AntdLayout.Content>
          </AntdLayout>
        </AntdLayout>
      </QueryClientProvider>
    </ConfigProvider>
  )
}
