const { withSentryConfig } = require('@sentry/nextjs')

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    dirs: ['app', 'components', 'lib'],
  },
}

module.exports = withSentryConfig(nextConfig, {
  silent: true,
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
  },
})
