import { NextResponse } from 'next/server'
import { handleOAuthCallback } from '@/lib/auth/handle-oauth-callback'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  const redirectUrl = await handleOAuthCallback(code, requestUrl.origin, '/auth/complete')
  return NextResponse.redirect(redirectUrl)
}
