import { useConfig } from 'nextra-theme-docs'
import type { DocsThemeConfig } from 'nextra-theme-docs'
import logo from '../public/favicon-96x96.png'

const Logo = () => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'nowrap',
      }}
    >
      <img
        src={logo.src}
        style={{
          maxWidth: '100%',
          width: 34,
          height: 34,
          aspectRatio: '1/1',
        }}
        alt="mahiro"
      />
      <span
        style={{
          padding: '0 0.5rem',
          fontSize: 18,
          fontWeight: 600,
        }}
      >
        Mahiro
      </span>
    </div>
  )
}

const config: DocsThemeConfig = {
  logo: <Logo />,
  project: {
    link: 'https://github.com/opq-osc/mahiro',
  },
  primaryHue: 270,
  // banner: {
  //   key: 'Nextra 2',
  //   text: 'Nextra 2 Alpha',
  // },
  // chat: {
  //   link: 'https://discord.gg/hEM84NMkRv', // Next.js discord server,
  // },
  docsRepositoryBase: 'https://github.com/opq-osc/mahiro/tree/main/docs',
  editLink: {
    text: '在 Github 上编辑此页',
  },
  sidebar: {
    toggleButton: true,
    defaultMenuCollapseLevel: 1,
    titleComponent({ title, type }) {
      if (type === 'separator') {
        return <span className="cursor-default">{title}</span>
      }
      return <>{title}</>
    },
  },
  feedback: {
    content: '有问题？点我反馈',
    labels: 'feedback',
  },
  useNextSeoProps() {
    const { frontMatter } = useConfig()
    return {
      additionalLinkTags: [
        {
          href: '/apple-touch-icon-180x180.png',
          rel: 'apple-touch-icon',
          sizes: '180x180',
        },
        {
          href: '/android-icon-192x192.png',
          rel: 'icon',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          href: '/favicon-96x96.png',
          rel: 'icon',
          sizes: '96x96',
          type: 'image/png',
        },
        {
          href: '/favicon-32x32.png',
          rel: 'icon',
          sizes: '32x32',
          type: 'image/png',
        },
        {
          href: '/favicon-16x16.png',
          rel: 'icon',
          sizes: '16x16',
          type: 'image/png',
        },
      ],
      additionalMetaTags: [
        { content: 'zh-CN', httpEquiv: 'Content-Language' },
        { content: 'Mahiro', name: 'apple-mobile-web-app-title' },
        { content: '#fff', name: 'msapplication-TileColor' },
      ],
      description:
        frontMatter.description || 'Mahiro is a JavaScript SDK for OPQBot',
      // openGraph: {
      //   images: [
      //     { url: frontMatter.image || 'https://nextra.vercel.app/og.png' },
      //   ],
      // },
      titleTemplate: '%s – Mahiro',
      // twitter: {
      //   cardType: 'summary_large_image',
      //   site: 'https://nextra.vercel.app',
      // },
    } as any
  },
  footer: {
    text: (
      <span>
        MIT {new Date().getFullYear()} ©{' '}
        <a href="https://github.com/opq-osc/mahiro" target="_blank">
          Mahiro
        </a>
      </span>
    ),
  },
}

export default config
