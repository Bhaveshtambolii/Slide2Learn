'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  BookOpen, Video, RefreshCw, LogOut, ChevronRight, Play,
  Loader2, CheckCircle2, Clock, AlertCircle, Download, LayoutGrid
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

type Course    = { id: string; name: string; section?: string; color?: string }
type Post      = { id: string; title: string; post_type: string; status: string; attachment_count: number; created_time: string }
type VideoItem = { id: string; title: string; status: string; public_url?: string; video_style: string; created_at: string }

const COLORS = ['#E85D26','#2563EB','#16A34A','#9333EA','#CA8A04','#0891B2']

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { icon: React.ReactNode; cls: string }> = {
    done:       { icon: <CheckCircle2 className="w-3.5 h-3.5" />, cls: 'bg-green-100 text-green-700' },
    processing: { icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />, cls: 'bg-blue-100 text-blue-700' },
    error:      { icon: <AlertCircle className="w-3.5 h-3.5" />, cls: 'bg-red-100 text-red-700' },
    pending:    { icon: <Clock className="w-3.5 h-3.5" />, cls: 'bg-border text-muted' },
    ready:      { icon: <CheckCircle2 className="w-3.5 h-3.5" />, cls: 'bg-green-100 text-green-700' },
    generating: { icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />, cls: 'bg-blue-100 text-blue-700' },
  }
  const s = map[status] || map.pending
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${s.cls}`}>
      {s.icon}{status}
    </span>
  )
}

export default function Dashboard() {
  const supabase = createClient()
  const router   = useRouter()

  const [user,          setUser]          = useState<any>(null)
  const [courses,       setCourses]       = useState<Course[]>([])
  const [activeCourse,  setActiveCourse]  = useState<string | null>(null)
  const [posts,         setPosts]         = useState<Post[]>([])
  const [videos,        setVideos]        = useState<VideoItem[]>([])
  const [syncing,       setSyncing]       = useState(false)
  const [loadingCourses,setLoadingCourses]= useState(true)
  const [syncMsg,       setSyncMsg]       = useState('')
  const [tab,           setTab]           = useState<'posts'|'videos'>('posts')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/')
      else setUser(user)
    })
  }, [])

  const loadCourses = useCallback(async () => {
    setLoadingCourses(true)
    const res = await fetch('/api/classroom/courses')
    if (res.ok) {
      const { courses: raw } = await res.json()
      const colored = (raw || []).map((c: Course, i: number) => ({ ...c, color: COLORS[i % COLORS.length] }))
      setCourses(colored)
      if (colored.length > 0) setActiveCourse(id => id || colored[0].id)
    }
    setLoadingCourses(false)
  }, [])

  useEffect(() => { loadCourses() }, [loadCourses])

  const loadData = useCallback(async () => {
    if (!activeCourse) return
    const [pr, vr] = await Promise.all([
      supabase.from('posts').select('*').eq('course_id', activeCourse).order('created_time', { ascending: false }),
      supabase.from('videos').select('*').eq('course_id', activeCourse).order('created_at', { ascending: false }),
    ])
    setPosts(pr.data || [])
    setVideos(vr.data || [])
  }, [activeCourse])

  useEffect(() => { loadData() }, [loadData])

  const syncCourse = async () => {
    if (!activeCourse) return
    setSyncing(true); setSyncMsg('')
    try {
      const res  = await fetch('/api/classroom/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: activeCourse }),
      })
      const data = await res.json()
      setSyncMsg(data.newPosts > 0 ? `✓ ${data.newPosts} new post(s) queued for video generation!` : '✓ All caught up — no new posts.')
      await loadData()
    } catch { setSyncMsg('⚠ Sync failed. Try again.') }
    setSyncing(false)
    setTimeout(() => setSyncMsg(''), 5000)
  }

  const signOut = async () => { await supabase.auth.signOut(); router.push('/') }
  const active  = courses.find(c => c.id === activeCourse)

  return (
    <div className="min-h-screen flex flex-col bg-paper">

      {/* Navbar */}
      <nav className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 border-b border-border bg-paper/90 backdrop-blur">
        <span className="font-display text-xl font-black">
          Slide<span className="text-accent italic">2</span>Learn
        </span>
        <div className="flex items-center gap-4">
          {user && <span className="text-sm text-muted hidden md:block">{user.email}</span>}
          <button onClick={signOut} className="flex items-center gap-1.5 text-sm text-muted hover:text-accent transition-colors">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <aside className="w-64 border-r border-border bg-surface flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-sm">My Courses</h2>
              <p className="text-xs text-muted">Google Classroom</p>
            </div>
            <button onClick={loadCourses} className="text-muted hover:text-ink transition-colors p-1">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 py-2">
            {loadingCourses ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted" />
              </div>
            ) : courses.length === 0 ? (
              <p className="text-xs text-muted px-4 py-6 text-center leading-relaxed">
                No courses found.<br/>Grant Classroom access and refresh.
              </p>
            ) : courses.map(c => (
              <button key={c.id} onClick={() => setActiveCourse(c.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-border/30 ${activeCourse === c.id ? 'bg-border/50' : ''}`}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ backgroundColor: c.color }}>{c.name.charAt(0)}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  {c.section && <p className="text-xs text-muted truncate">{c.section}</p>}
                </div>
                {activeCourse === c.id && <ChevronRight className="w-3.5 h-3.5 text-muted shrink-0" />}
              </button>
            ))}
          </div>

          <div className="p-4 border-t border-border">
            <p className="text-xs text-muted leading-relaxed">
              💡 Run <code className="font-mono bg-border/60 px-1 rounded text-[10px]">notebooklm_worker.py</code> locally to start generating AI video explanations.
            </p>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          {!active ? (
            <div className="h-full flex items-center justify-center text-muted">
              <div className="text-center">
                <LayoutGrid className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium">Select a course to get started</p>
                <p className="text-sm mt-1">Your AI video explanations will appear here</p>
              </div>
            </div>
          ) : (
            <>
              {/* Course header */}
              <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: active.color }}>{active.name.charAt(0)}</div>
                  <div>
                    <h1 className="font-display text-2xl font-bold leading-tight">{active.name}</h1>
                    {active.section && <p className="text-sm text-muted">{active.section}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {syncMsg && <span className="text-sm text-muted animate-fade-in">{syncMsg}</span>}
                  <button onClick={syncCourse} disabled={syncing}
                    className="flex items-center gap-2 bg-ink text-paper px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-accent transition-colors disabled:opacity-60">
                    {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    {syncing ? 'Syncing…' : 'Sync Now'}
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: 'Total Posts',   value: posts.length,                                    icon: BookOpen },
                  { label: 'Videos Ready',  value: videos.filter(v => v.status === 'ready').length,  icon: Video    },
                  { label: 'Pending',       value: posts.filter(p => p.status === 'pending').length, icon: Clock    },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="bg-surface border border-border rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-muted mb-1">
                      <Icon className="w-4 h-4" />
                      <span className="text-xs">{label}</span>
                    </div>
                    <p className="font-display text-4xl font-black">{value}</p>
                  </div>
                ))}
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mb-4 bg-surface border border-border rounded-xl p-1 w-fit">
                {(['posts', 'videos'] as const).map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${tab === t ? 'bg-paper shadow-sm text-ink' : 'text-muted hover:text-ink'}`}>
                    {t === 'posts' ? `Slides & Posts (${posts.length})` : `AI Videos (${videos.length})`}
                  </button>
                ))}
              </div>

              {/* Posts list */}
              {tab === 'posts' && (
                <div className="space-y-2">
                  {posts.length === 0 ? (
                    <div className="py-16 text-center text-muted">
                      <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-20" />
                      <p className="font-medium mb-1">No posts synced yet</p>
                      <p className="text-sm">Click "Sync Now" to fetch slides and posts from Classroom</p>
                    </div>
                  ) : posts.map(post => (
                    <div key={post.id} className="flex items-center gap-4 bg-surface border border-border rounded-xl px-4 py-3 hover:border-accent/30 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{post.title}</p>
                        <p className="text-xs text-muted mt-0.5">
                          {post.post_type} · {post.attachment_count} file(s)
                          {post.created_time && ` · ${formatDistanceToNow(new Date(post.created_time), { addSuffix: true })}`}
                        </p>
                      </div>
                      <StatusBadge status={post.status} />
                    </div>
                  ))}
                </div>
              )}

              {/* Videos grid */}
              {tab === 'videos' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {videos.length === 0 ? (
                    <div className="col-span-3 py-16 text-center text-muted">
                      <Video className="w-10 h-10 mx-auto mb-3 opacity-20" />
                      <p className="font-medium mb-1">No AI videos yet</p>
                      <p className="text-sm">Sync a course and run the worker to generate video explanations</p>
                    </div>
                  ) : videos.map(v => (
                    <div key={v.id} className="bg-surface border border-border rounded-2xl overflow-hidden group hover:border-accent/40 transition-colors">
                      <div className="aspect-video bg-ink/5 flex items-center justify-center relative">
                        {v.status === 'ready'
                          ? <Play className="w-10 h-10 text-muted group-hover:text-accent transition-colors" />
                          : v.status === 'generating'
                          ? <div className="text-center">
                              <Loader2 className="w-8 h-8 animate-spin text-muted mx-auto mb-2" />
                              <p className="text-xs text-muted">Generating AI video…</p>
                            </div>
                          : <AlertCircle className="w-8 h-8 text-red-400" />}
                        <div className="absolute top-2 right-2">
                          <span className="text-[10px] bg-ink/70 text-white px-2 py-0.5 rounded-full">{v.video_style}</span>
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="font-semibold text-sm mb-1 truncate">{v.title}</p>
                        <p className="text-xs text-muted mb-3">
                          {formatDistanceToNow(new Date(v.created_at), { addSuffix: true })}
                        </p>
                        {v.status === 'ready' && v.public_url && (
                          <a href={v.public_url} download
                            className="flex items-center gap-1.5 text-xs font-medium text-accent hover:underline">
                            <Download className="w-3.5 h-3.5" /> Download MP4
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
