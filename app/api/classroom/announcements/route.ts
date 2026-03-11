import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export async function GET(request: Request) {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.provider_token) return NextResponse.json({ error: 'No token' }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    if (!courseId) return NextResponse.json({ error: 'courseId required' }, { status: 400 })
    const { fetchAnnouncements } = await import('@/lib/classroom')
    const announcements = await fetchAnnouncements(session.provider_token, courseId)
    return NextResponse.json({ announcements })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
