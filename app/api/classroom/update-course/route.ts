import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function PATCH(request: Request) {
  try {
    const { createClient, createAdminClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { courseId, customName, archived } = await request.json()
    if (!courseId) return NextResponse.json({ error: 'courseId required' }, { status: 400 })

    const admin  = createAdminClient()
    const update: Record<string, any> = {}
    if (customName  !== undefined) update.custom_name = customName.trim() || null
    if (archived    !== undefined) update.archived     = archived

    const { error } = await admin
      .from('courses')
      .update(update)
      .eq('id', courseId)
      .eq('user_id', session.user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
