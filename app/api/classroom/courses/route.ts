import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { createClient, createAdminClient } = await import('@/lib/supabase/server')
    const { fetchCourses } = await import('@/lib/classroom')

    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const accessToken = session.provider_token
    if (!accessToken) return NextResponse.json({ error: 'No Google access token' }, { status: 401 })

    const courses = await fetchCourses(accessToken)
    const admin = createAdminClient()
    const userId = session.user.id

    const rows = courses.map((c: any) => ({
      id: c.id,
      user_id: userId,
      name: c.name || 'Untitled',
      section: c.section || null,
      description: c.description || null,
    }))

    if (rows.length > 0) {
      await admin.from('courses').upsert(rows, { onConflict: 'id' })
    }

    return NextResponse.json({ courses })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
