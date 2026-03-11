import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export async function GET(request: Request) {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.provider_token) return NextResponse.json({ error: 'No token' }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const courseId     = searchParams.get('courseId')
    const courseWorkId = searchParams.get('courseWorkId')
    if (!courseId || !courseWorkId) return NextResponse.json({ error: 'courseId and courseWorkId required' }, { status: 400 })
    const { fetchSubmissions } = await import('@/lib/classroom')
    const submissions = await fetchSubmissions(session.provider_token, courseId, courseWorkId)
    return NextResponse.json({ submissions })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
