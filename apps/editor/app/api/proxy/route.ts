import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/require-auth'
import { requireProSubscription } from '@/lib/api/require-pro'
import { rateLimit } from '@/lib/api/rate-limit'

export const dynamic = 'force-dynamic'

const MAX_RESPONSE_BYTES = 10 * 1024 * 1024 // 10 MB

/**
 * Block requests to private/reserved IP ranges to prevent SSRF.
 * Checks the hostname against known internal ranges.
 */
function isPrivateHost(hostname: string): boolean {
  // Block localhost aliases
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname === '0.0.0.0'
  ) {
    return true
  }

  // Block metadata endpoints (AWS, GCP, Azure)
  if (hostname === '169.254.169.254' || hostname === 'metadata.google.internal') {
    return true
  }

  // Block private IPv4 ranges
  const parts = hostname.split('.')
  if (parts.length === 4 && parts.every((p) => /^\d+$/.test(p))) {
    const [a, b] = parts.map(Number)
    if (a === 10) return true                          // 10.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true   // 172.16.0.0/12
    if (a === 192 && b === 168) return true            // 192.168.0.0/16
    if (a === 169 && b === 254) return true            // 169.254.0.0/16 (link-local)
    if (a === 127) return true                         // 127.0.0.0/8
    if (a === 0) return true                           // 0.0.0.0/8
  }

  // Block IPv6 private ranges
  if (hostname.startsWith('[')) {
    const ip = hostname.slice(1, -1).toLowerCase()
    if (ip === '::1' || ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80')) {
      return true
    }
  }

  return false
}

export async function GET(request: NextRequest) {
  // Require authentication
  const auth = await requireAuth()
  if (auth.error) return auth.error

  // Require active Pro subscription
  const proCheck = await requireProSubscription()
  if (proCheck) return proCheck

  // Rate limit: 60 requests per minute per user
  const rl = await rateLimit(`proxy:${auth.user.id}`, { limit: 60, windowMs: 60_000 })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    )
  }

  const url = request.nextUrl.searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL required' }, { status: 400 })
  }

  // Validate URL
  let targetUrl: URL
  try {
    targetUrl = new URL(url)
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  // Only allow http/https
  if (!['http:', 'https:'].includes(targetUrl.protocol)) {
    return NextResponse.json({ error: 'Only HTTP/HTTPS URLs allowed' }, { status: 400 })
  }

  // Block private/internal hosts (SSRF protection)
  if (isPrivateHost(targetUrl.hostname)) {
    return NextResponse.json({ error: 'Internal addresses are not allowed' }, { status: 403 })
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15_000) // 15s timeout

    const response = await fetch(targetUrl.href, {
      headers: {
        'User-Agent': 'TrailguideProxy/1.0',
        'Accept': request.headers.get('accept') || '*/*',
        'Accept-Language': request.headers.get('accept-language') || 'en-US,en;q=0.9',
      },
      redirect: 'follow',
      signal: controller.signal,
    })

    clearTimeout(timeout)

    const contentType = response.headers.get('content-type') || ''

    // Enforce response size limit for text content
    const contentLength = response.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > MAX_RESPONSE_BYTES) {
      return NextResponse.json({ error: 'Response too large' }, { status: 502 })
    }

    // Handle HTML content - inject base tag + picker script
    if (contentType.includes('text/html')) {
      let html = await response.text()

      if (html.length > MAX_RESPONSE_BYTES) {
        return NextResponse.json({ error: 'Response too large' }, { status: 502 })
      }

      // Strip CSP meta tags so picker.js can execute
      html = html.replace(/<meta[^>]+http-equiv\s*=\s*["']Content-Security-Policy["'][^>]*>/gi, '')

      // Inject <base href> so the browser resolves all relative URLs against the original site
      const baseTag = `<base href="${targetUrl.href}">`
      if (html.includes('<head>')) {
        html = html.replace('<head>', '<head>' + baseTag)
      } else if (html.includes('<HEAD>')) {
        html = html.replace('<HEAD>', '<HEAD>' + baseTag)
      } else if (html.includes('<html>') || html.includes('<HTML>')) {
        html = html.replace(/<html[^>]*>/i, (match) => match + '<head>' + baseTag + '</head>')
      } else {
        html = baseTag + html
      }

      // Inject picker script before </body>
      const pickerScript = `<script src="/picker.js"></script>`

      if (html.includes('</body>')) {
        html = html.replace('</body>', pickerScript + '</body>')
      } else if (html.includes('</html>')) {
        html = html.replace('</html>', pickerScript + '</html>')
      } else {
        html += pickerScript
      }

      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'X-Frame-Options': 'SAMEORIGIN',
          // Restrict what the proxied page can do
          'Content-Security-Policy': "script-src 'unsafe-inline' 'unsafe-eval' * blob: data:; frame-ancestors 'self';",
        },
      })
    }

    // Handle CSS - rewrite url() references
    if (contentType.includes('text/css')) {
      let css = await response.text()
      if (css.length > MAX_RESPONSE_BYTES) {
        return NextResponse.json({ error: 'Response too large' }, { status: 502 })
      }
      css = rewriteCssUrls(css, targetUrl)

      return new NextResponse(css, {
        headers: { 'Content-Type': 'text/css' },
      })
    }

    // Handle JavaScript - pass through
    if (contentType.includes('javascript')) {
      const js = await response.text()
      if (js.length > MAX_RESPONSE_BYTES) {
        return NextResponse.json({ error: 'Response too large' }, { status: 502 })
      }
      return new NextResponse(js, {
        headers: { 'Content-Type': contentType },
      })
    }

    // Non-text content: proxy as-is with streaming
    return new NextResponse(response.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timed out' }, { status: 504 })
    }
    console.error('Proxy fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch URL' },
      { status: 502 }
    )
  }
}

function rewriteCssUrls(css: string, base: URL): string {
  const origin = base.origin
  const basePath = base.pathname.substring(0, base.pathname.lastIndexOf('/') + 1)

  // Rewrite url(/path) to absolute
  css = css.replace(/url\(['"]?\/([^'")]+)['"]?\)/g, `url('${origin}/$1')`)

  // Rewrite url(./path) or url(path) to absolute
  css = css.replace(/url\(['"]?\.\/([^'")]+)['"]?\)/g, `url('${origin}${basePath}$1')`)

  return css
}
