import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { createClient, createAdminClient } = await import('@/lib/supabase/server')
    const { fetchAnnouncements, fetchCourseMaterials, extractAttachments } = await import('@/lib/classroom')

    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { courseId } = await request.json()
    if (!courseId) return NextResponse.json({ error: 'courseId required' }, { status: 400 })

    const token = session.provider_token || session.access_token
    if (!token) return NextResponse.json({ error: 'No Google token' }, { status: 401 })

    const admin  = createAdminClient()
    const userId = session.user.id

    const { data: existing } = await admin
      .from('posts').select('id').eq('course_id', courseId).eq('user_id', userId)
    const processedIds = new Set((existing || []).map((r: any) => r.id))

    // Only use scopes we have:
    // ✅ announcements.readonly  → fetchAnnouncements
    // ✅ courseworkmaterials.readonly → fetchCourseMaterials
    // ❌ coursework.me.readonly  → fetchCourseWork REMOVED
    const [announcements, materials] = await Promise.all([
      fetchAnnouncements(token, courseId),
      fetchCourseMaterials(token, courseId),
    ])

    const allPosts = [...announcements, ...materials]
    const newPosts = allPosts.filter((p: any) => !processedIds.has(p.id))

    if (newPosts.length === 0) return NextResponse.json({ newPosts: 0 })

    const rows = newPosts.map((post: any) => ({
      id:               post.id,
      course_id:        courseId,
      user_id:          userId,
      title:            post.title || post.text?.slice(0, 100) || 'Untitled',
      post_type:        post.workType ? 'material' : 'announcement',
      created_time:     post.creationTime || post.createdTime,
      attachment_count: extractAttachments(post.materials || []).length,
      status:           'pending',
    }))

    await admin.from('posts').insert(rows)
    return NextResponse.json({ newPosts: newPosts.length, posts: rows })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}