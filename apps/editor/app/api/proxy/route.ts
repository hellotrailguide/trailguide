import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
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

  try {
    const response = await fetch(targetUrl.href, {
      headers: {
        'User-Agent': request.headers.get('user-agent') || 'TrailguideProxy/1.0',
        'Accept': request.headers.get('accept') || '*/*',
        'Accept-Language': request.headers.get('accept-language') || 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    })

    const contentType = response.headers.get('content-type') || ''

    // Handle HTML content - inject picker script
    if (contentType.includes('text/html')) {
      let html = await response.text()

      // Inject picker script before </body>
      const pickerScript = `<script src="/picker.js"></script>`

      if (html.includes('</body>')) {
        html = html.replace('</body>', pickerScript + '</body>')
      } else if (html.includes('</html>')) {
        html = html.replace('</html>', pickerScript + '</html>')
      } else {
        html += pickerScript
      }

      // Rewrite relative URLs to absolute
      html = rewriteUrls(html, targetUrl)

      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'X-Frame-Options': 'SAMEORIGIN',
        },
      })
    }

    // Handle CSS - rewrite url() references
    if (contentType.includes('text/css')) {
      let css = await response.text()
      css = rewriteCssUrls(css, targetUrl)

      return new NextResponse(css, {
        headers: { 'Content-Type': 'text/css' },
      })
    }

    // Handle JavaScript - pass through
    if (contentType.includes('javascript')) {
      const js = await response.text()
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
    console.error('Proxy fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch URL' },
      { status: 502 }
    )
  }
}

function rewriteUrls(html: string, base: URL): string {
  const origin = base.origin
  const basePath = base.pathname.substring(0, base.pathname.lastIndexOf('/') + 1)

  // Rewrite src="/path" to absolute URL
  html = html.replace(/src="\/([^"\/][^"]*)"/g, `src="${origin}/$1"`)

  // Rewrite href="/path" to absolute URL (but not anchor links)
  html = html.replace(/href="\/([^"\/][^"]*)"/g, `href="${origin}/$1"`)

  // Rewrite src="./path" or src="path" (relative) to absolute
  html = html.replace(/src="\.\/([^"]*)"/g, `src="${origin}${basePath}$1"`)

  // Rewrite href="./path" (relative) to absolute
  html = html.replace(/href="\.\/([^"]*)"/g, `href="${origin}${basePath}$1"`)

  // Handle srcset attributes
  html = html.replace(/srcset="([^"]*)"/g, (match, srcset) => {
    const rewritten = srcset.split(',').map((src: string) => {
      const parts = src.trim().split(/\s+/)
      if (parts[0].startsWith('/') && !parts[0].startsWith('//')) {
        parts[0] = origin + parts[0]
      }
      return parts.join(' ')
    }).join(', ')
    return `srcset="${rewritten}"`
  })

  return html
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
