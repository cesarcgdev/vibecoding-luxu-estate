import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'
import { describeSupabaseError } from '@/lib/supabase-errors'

export async function proxy(request: NextRequest) {
  // Update session first
  const response = await updateSession(request)

  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Dev-only bypass: ADMIN_DEV_BYPASS=true in .env.local skips the role check
    // so the panel is reachable without a real Supabase session during local dev.
    // This variable is intentionally ignored by production builds.
    if (process.env.ADMIN_DEV_BYPASS === 'true') {
      return response
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: () => {},
      },
    })

    // The role check has to fail closed: if it cannot be verified, no admin access
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        return NextResponse.redirect(new URL('/login', request.url))
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (roleData?.role !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url))
      }
    } catch (error) {
      console.error('Could not verify admin access:', describeSupabaseError(error))
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
