import React from 'react'
import Image from 'next/image'
import { DocsThemeConfig } from 'nextra-theme-docs'

const config: DocsThemeConfig = {
  logo: (
    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Image src="/icon.png" alt="Trailguide" width={44} height={44} />
      <span style={{ fontWeight: 700, fontSize: 18 }}>Trailguide</span>
    </span>
  ),
  logoLink: 'https://gettrailguide.com',
  project: {
    link: 'https://github.com/hellotrailguide/trailguide',
  },
  docsRepositoryBase: 'https://github.com/hellotrailguide/trailguide/tree/main/apps/docs',
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="icon" href="/icon.png" type="image/png" />
      <meta property="og:title" content="Trailguide Documentation" />
      <meta property="og:description" content="Product tour SDK for web applications" />
    </>
  ),
  sidebar: {
    defaultMenuCollapseLevel: 1,
    toggleButton: true,
  },
  footer: {
    content: (
      <span>
        MIT {new Date().getFullYear()} ©{' '}
        <a href="https://gettrailguide.com" target="_blank" rel="noopener">
          Trailguide
        </a>
        {' — '}
        <a href="https://app.gettrailguide.com" target="_blank" rel="noopener">
          Open Editor
        </a>
      </span>
    ),
  },
}

export default config
