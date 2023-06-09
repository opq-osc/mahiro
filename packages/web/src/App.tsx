import {
  createHashRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
  useNavigate,
} from 'react-router-dom'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { useEffect } from 'react'
import { EMenu } from './components/Layout/options'
import { Plugins } from './pages/Plugins'
import { Groups } from './pages/Groups'
import { QQs } from './pages/QQs'
import { Panel } from './pages/Panel'

function Redirect({ to }: { to: string }) {
  const navigate = useNavigate()
  useEffect(() => {
    navigate(to, { replace: true })
  }, [])
  return null
}

const router = createHashRouter(
  createRoutesFromElements(
    <Route element={<Layout />}>
      <Route index element={<Redirect to={`/${EMenu.home}`} />} />
      <Route path={EMenu.home} element={<Home />} />
      <Route path={EMenu.groups} element={<Groups />} />
      <Route path={EMenu.plugins} element={<Plugins />} />
      <Route path={EMenu.qqs} element={<QQs />} />
      <Route path={EMenu.panel} element={<Panel />} />
    </Route>,
  ),
)

export function App() {
  return <RouterProvider router={router} />
}
