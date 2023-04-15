import { ConfigProvider, Layout as AntdLayout, Menu } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { EMenu, menus } from './options'
import {
  HomeOutlined,
  FireOutlined,
  UsergroupAddOutlined,
  QqOutlined,
  DashboardOutlined,
} from '@ant-design/icons'
import { useCallback, useEffect, useState } from 'react'
import zhCN from 'antd/locale/zh_CN'
import dayjs from 'dayjs'

import 'dayjs/locale/zh-cn'
import { useVersion } from '@/stores/global'
import { useVersionGet } from '@/hooks/useVersionGet'
dayjs.locale('zh-cn')

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 这个配置先不要关，在这个场景下效果不错
      // refetchOnWindowFocus: false,
    },
  },
})

const Logo = styled.div`
  color: #b080fe;
  font-family: Seravek, 'Gill Sans Nova', Ubuntu, Calibri, 'DejaVu Sans',
    source-sans-pro, sans-serif;
  font-size: 24px;
  font-weight: 550;
  padding: 15px 10px;
  cursor: default;
  text-align: center;
  border-inline-end: 1px solid rgba(5, 5, 5, 0.06);
`

const Version = styled.div`
  font-size: 12px;
  font-weight: 550;
  padding: 0 5px;
  font-style: italic;
  letter-spacing: 0.3px;
`

export const Layout = () => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#B080FE',
        },
      }}
      locale={zhCN}
    >
      <QueryClientProvider client={queryClient}>
        <Internal />
      </QueryClientProvider>
    </ConfigProvider>
  )
}

const Internal = () => {
  const location = useLocation()
  const navigate = useNavigate()

  useVersionGet()
  const [versionInfo] = useVersion()
  const version = versionInfo?.version || ''

  const getDefaultSelectedKeys = useCallback(() => {
    const pathname = location.pathname
    const mached = menus.find((m) => {
      if (pathname.startsWith(`/${m}`)) {
        return true
      }
    })
    return mached ? [mached] : [EMenu.home]
  }, [location.pathname])

  const [selected, setSelected] = useState<string[]>(getDefaultSelectedKeys())

  // listen path change
  useEffect(() => {
    setSelected(getDefaultSelectedKeys())
  }, [location.pathname])

  const changePath = useCallback((p: string) => {
    navigate(p)
  }, [])

  return (
    <AntdLayout
      style={{
        height: '100vh',
        overflow: 'hidden'
      }}
    >
      <AntdLayout.Sider theme="light" trigger={null} collapsible>
        <Logo>
          Mahiro
          <Version>{version}</Version>
        </Logo>
        <Menu
          style={{
            height: '100%',
          }}
          mode="inline"
          selectedKeys={selected}
          onClick={(e) => {
            setSelected([e.key])
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
            {
              key: EMenu.qqs,
              icon: <QqOutlined />,
              label: 'QQ管理',
            },
            {
              key: EMenu.panel,
              icon: <DashboardOutlined />,
              label: '超级仪表盘',
            },
          ]}
        />
      </AntdLayout.Sider>
      <AntdLayout className="site-layout">
        <AntdLayout.Content
          style={{
            background: '#fff',
            padding: 24,
            overflow: 'auto'
          }}
        >
          <Outlet />
        </AntdLayout.Content>
      </AntdLayout>
    </AntdLayout>
  )
}
