import React from 'react'
import Image from 'next/image'
import { DocsThemeConfig } from 'nextra-theme-docs'

const config: DocsThemeConfig = {
  logo: (
    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Image src="/logo.svg" alt="Trailguide" width={28} height={28} />
      <span style={{ fontWeight: 700, fontSize: 16 }}>Trailguide</span>
    </span>
  ),
  project: {
    link: 'https://github.com/hellotrailguide/trailguide',
  },
  docsRepositoryBase: 'https://github.com/hellotrailguide/trailguide/tree/main/apps/docs',
  useNextSeoProps() {
    return { titleTemplate: '%s – Trailguide Docs' }
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      <meta property="og:title" content="Trailguide Documentation" />
      <meta property="og:description" content="Product tour SDK for web applications" />
    </>
  ),
  primaryHue: 220,
  sidebar: {
    defaultMenuCollapseLevel: 1,
    toggleButton: true,
  },
  footer: {
    text: (
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
