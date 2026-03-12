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

    // Only fetch materials — uses classroom.courseworkmaterials.readonly (available ✅)
    // Skipping courseWork.list — needs classroom.coursework.me.readonly (restricted ❌)
    const materials: any[] = []
    let pt: string | undefined = undefined
    do {
      const res: any = await classroom.courses.courseWorkMaterials.list({
        courseId, pageSize: 100,
        ...(pt ? { pageToken: pt } : {}),
      })
      materials.push(...(res.data.courseWorkMaterial || []))
      pt = res.data.nextPageToken
    } while (pt)

    return NextResponse.json({ courseWork: [], materials })
  } catch (e: any) {
    console.error('coursework error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}