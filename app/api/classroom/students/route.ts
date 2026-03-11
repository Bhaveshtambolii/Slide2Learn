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
    const { fetchStudents } = await import('@/lib/classroom')
    const students = await fetchStudents(session.provider_token, courseId)
    return NextResponse.json({ students })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
