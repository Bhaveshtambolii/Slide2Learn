import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export async function GET(request: Request) {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    const token = session.provider_token || session.access_token
    if (!token) return NextResponse.json({ error: 'No access token' }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    if (!courseId) return NextResponse.json({ error: 'courseId required' }, { status: 400 })
    const { google } = await import('googleapis')
    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: token })
    const classroom = google.classroom({ version: 'v1', auth })
    const students: any[] = []
    let pageToken: string | undefined = undefined
    do {
      const res: any = await classroom.courses.students.list({
        courseId, pageSize: 200,
        ...(pageToken ? { pageToken } : {}),
      })
      students.push(...(res.data.students || []))
      pageToken = res.data.nextPageToken
    } while (pageToken)
    return NextResponse.json({ students })
  } catch (e: any) {
    console.error('students error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
