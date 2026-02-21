import nextra from 'nextra'

const withNextra = nextra({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.tsx',
  defaultShowCopyCode: true,
  // Nextra v3: allow pages/reference without conflicting with Next.js API routes
})

export default withNextra({
  reactStrictMode: true,
  // Nextra's _meta.ts files aren't React components — suppress the false-positive
  typescript: { ignoreBuildErrors: true },
})
