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
    const courseWorkId = searchParams.get('courseWorkId')
    if (!courseId || !courseWorkId) return NextResponse.json({ error: 'courseId and courseWorkId required' }, { status: 400 })
    const { google } = await import('googleapis')
    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: token })
    const classroom = google.classroom({ version: 'v1', auth })
    const submissions: any[] = []
    let pageToken: string | undefined = undefined
    do {
      const res: any = await classroom.courses.courseWork.studentSubmissions.list({
        courseId, courseWorkId, pageSize: 100,
        ...(pageToken ? { pageToken } : {}),
      })
      submissions.push(...(res.data.studentSubmissions||[]))
      pageToken = res.data.nextPageToken
    } while (pageToken)
    return NextResponse.json({ submissions })
  } catch (e: any) {
    console.error('submissions error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
