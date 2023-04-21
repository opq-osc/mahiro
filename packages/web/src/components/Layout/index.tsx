import { ConfigProvider, Layout as AntdLayout, Menu } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { EMenu, menus } from './options'
import {
  HomeTwoTone,
  AppstoreTwoTone,
  MessageTwoTone,
  ApiTwoTone,
  DashboardTwoTone,
  LeftCircleTwoTone,
  RightCircleTwoTone,
} from '@ant-design/icons'
import { useCallback, useEffect, useState } from 'react'
import zhCN from 'antd/locale/zh_CN'
import { useVersion } from '@/stores/global'
import { useVersionGet } from '@/hooks/useVersionGet'
import styles from './index.module.scss'

import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { medias } from '@/constants/media'
dayjs.locale('zh-cn')

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 这个配置先不要关，在这个场景下效果不错
      // refetchOnWindowFocus: false,
    },
  },
})

const Logo = styled.div<{ collapsed: boolean }>`
  color: #b080fe;
  font-family: Seravek, 'Gill Sans Nova', Ubuntu, Calibri, 'DejaVu Sans',
    source-sans-pro, sans-serif;
  font-size: 24px;
  font-weight: 550;
  padding: 15px 10px;
  cursor: default;
  text-align: center;
  border-inline-end: 1px solid rgba(5, 5, 5, 0.06);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  > img {
    max-width: 100%;
    width: 50px;
    aspect-ratio: 1/1;
    user-select: none;
    pointer-events: none;

    ${medias.mobile} {
      width: 30px;
    }
  }

  ${(props) => {
    if (props?.collapsed) {
      return `
        font-size: 0;
      `
    }
  }}

  ${medias.mobile} {
    font-size: 0;
  }
`

const Version = styled.div`
  font-size: 12px;
  font-weight: 550;
  padding: 0 5px;
  font-style: italic;
  letter-spacing: 0.3px;
`
const themeColor = '#B080FE'
export const Layout = () => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: themeColor,
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
  const [collapsed, setCollapsed] = useState(() => {
    return window.innerWidth < 768
  })

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
        overflow: 'hidden',
        backgroundColor: '#fff',
      }}
    >
      <AntdLayout.Sider
        theme="light"
        collapsible
        collapsedWidth={50}
        collapsed={collapsed}
        onCollapse={(collapsed) => {
          setCollapsed(collapsed)
        }}
        trigger={
          <div
            style={{
              transform: 'scale(1.2)',
            }}
          >
            {!collapsed ? (
              <LeftCircleTwoTone twoToneColor={themeColor} />
            ) : (
              <RightCircleTwoTone twoToneColor={themeColor} />
            )}
          </div>
        }
        className={styles.sider}
      >
        <Logo collapsed={collapsed}>
          <img src="/favicon.png" alt="mahiro" />
          <span>Mahiro</span>
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
              // todo: add data dashboard
              icon: <HomeTwoTone twoToneColor={themeColor} />,
              label: '首页',
            },
            {
              key: EMenu.plugins,
              icon: <ApiTwoTone twoToneColor={themeColor} />,
              label: '插件管理',
            },
            {
              key: EMenu.groups,
              icon: <MessageTwoTone twoToneColor={themeColor} />,
              label: '群组管理',
            },
            {
              key: EMenu.qqs,
              icon: <AppstoreTwoTone twoToneColor={themeColor} />,
              label: '账号管理',
            },
            {
              key: EMenu.panel,
              icon: <DashboardTwoTone twoToneColor={themeColor} />,
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
            overflow: 'auto',
          }}
        >
          <Outlet />
        </AntdLayout.Content>
      </AntdLayout>
    </AntdLayout>
  )
}
