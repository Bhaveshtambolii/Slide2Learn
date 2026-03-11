'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  BookOpen, Video, RefreshCw, LogOut, ChevronRight, Play,
  Loader2, CheckCircle2, Clock, AlertCircle, Download,
  LayoutGrid, Pencil, Archive, ArchiveRestore, X, Check,
  MoreVertical, Eye, EyeOff
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

type Course    = { id: string; name: string; custom_name?: string; section?: string; archived?: boolean }
type Post      = { id: string; title: string; post_type: string; status: string; attachment_count: number; created_time: string }
type VideoItem = { id: string; title: string; status: string; public_url?: string; video_style: string; created_at: string }

const COLORS = ['#0D0D0D','#3B3B3B','#5C5C5C','#8C8070','#0D0D0D','#3B3B3B']

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string; icon: React.ReactNode }> = {
    done:       { label:'Done',       bg:'#ECFDF5', color:'#065F46', icon:<CheckCircle2 size={11}/> },
    processing: { label:'Processing', bg:'#EFF6FF', color:'#1D4ED8', icon:<Loader2 size={11} style={{animation:'spin 1s linear infinite'}}/> },
    error:      { label:'Error',      bg:'#FEF2F2', color:'#991B1B', icon:<AlertCircle size={11}/> },
    pending:    { label:'Pending',    bg:'#F5F5F5', color:'#6B7280', icon:<Clock size={11}/> },
    ready:      { label:'Ready',      bg:'#ECFDF5', color:'#065F46', icon:<CheckCircle2 size={11}/> },
    generating: { label:'Generating', bg:'#EFF6FF', color:'#1D4ED8', icon:<Loader2 size={11} style={{animation:'spin 1s linear infinite'}}/> },
  }
  const s = map[status] || map.pending
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:s.bg, color:s.color, padding:'4px 10px', borderRadius:100, fontSize:12, fontWeight:600 }}>
      {s.icon}{s.label}
    </span>
  )
}

// ── Inline rename input ──────────────────────────────────────
function RenameInput({ value, onSave, onCancel }: { value: string; onSave: (v: string) => void; onCancel: () => void }) {
  const [val, setVal] = useState(value)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { ref.current?.focus(); ref.current?.select() }, [])
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, flex:1 }}>
      <input
        ref={ref}
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key==='Enter') onSave(val); if (e.key==='Escape') onCancel() }}
        style={{ flex:1, background:'#F5F0E8', border:'1px solid #0D0D0D', borderRadius:6, padding:'3px 8px', fontSize:13, fontFamily:'DM Sans, sans-serif', color:'#0D0D0D', outline:'none' }}
      />
      <button onClick={() => onSave(val)} style={{ background:'none', border:'none', cursor:'pointer', color:'#065F46', padding:2, display:'flex' }}><Check size={14}/></button>
      <button onClick={onCancel}          style={{ background:'none', border:'none', cursor:'pointer', color:'#991B1B', padding:2, display:'flex' }}><X size={14}/></button>
    </div>
  )
}

// ── Course context menu ──────────────────────────────────────
function CourseMenu({ course, onRename, onArchive, onClose }: {
  course: Course
  onRename: () => void
  onArchive: () => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} style={{ position:'absolute', right:8, top:40, background:'#F5F0E8', border:'1px solid #D4CCBE', borderRadius:12, boxShadow:'0 8px 30px rgba(0,0,0,0.12)', zIndex:50, minWidth:160, padding:4 }}>
      <button onClick={() => { onRename(); onClose() }} style={{ display:'flex', alignItems:'center', gap:9, width:'100%', padding:'9px 14px', background:'none', border:'none', cursor:'pointer', fontSize:13, fontFamily:'DM Sans, sans-serif', color:'#0D0D0D', borderRadius:8, transition:'background 0.1s', textAlign:'left' }}
        onMouseEnter={e => (e.currentTarget.style.background='#EDE8DF')}
        onMouseLeave={e => (e.currentTarget.style.background='none')}>
        <Pencil size={13} color="#8C8070"/> Rename
      </button>
      <button onClick={() => { onArchive(); onClose() }} style={{ display:'flex', alignItems:'center', gap:9, width:'100%', padding:'9px 14px', background:'none', border:'none', cursor:'pointer', fontSize:13, fontFamily:'DM Sans, sans-serif', color: course.archived ? '#065F46' : '#991B1B', borderRadius:8, transition:'background 0.1s', textAlign:'left' }}
        onMouseEnter={e => (e.currentTarget.style.background='#EDE8DF')}
        onMouseLeave={e => (e.currentTarget.style.background='none')}>
        {course.archived ? <><ArchiveRestore size={13}/> Unarchive</> : <><Archive size={13}/> Archive</>}
      </button>
    </div>
  )
}

export default function Dashboard() {
  const supabase = createClient()
  const router   = useRouter()

  const [user,           setUser]           = useState<any>(null)
  const [courses,        setCourses]        = useState<Course[]>([])
  const [activeCourse,   setActiveCourse]   = useState<string|null>(null)
  const [posts,          setPosts]          = useState<Post[]>([])
  const [videos,         setVideos]         = useState<VideoItem[]>([])
  const [syncing,        setSyncing]        = useState(false)
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [syncMsg,        setSyncMsg]        = useState('')
  const [tab,            setTab]            = useState<'posts'|'videos'>('posts')
  const [showArchived,   setShowArchived]   = useState(false)
  const [renamingId,     setRenamingId]     = useState<string|null>(null)
  const [menuOpenId,     setMenuOpenId]     = useState<string|null>(null)
  const [saving,         setSaving]         = useState(false)

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
      // Merge with local DB to get custom_name + archived
      const { data: dbCourses } = await supabase.from('courses').select('id,custom_name,archived')
      const dbMap = Object.fromEntries((dbCourses || []).map((c: any) => [c.id, c]))
      const merged = (raw || []).map((c: Course, i: number) => ({
        ...c,
        custom_name: dbMap[c.id]?.custom_name ?? undefined,
        archived:    dbMap[c.id]?.archived    ?? false,
      }))
      setCourses(merged)
      if (merged.length > 0) setActiveCourse(id => id || merged.find((c: Course) => !c.archived)?.id || merged[0].id)
    }
    setLoadingCourses(false)
  }, [])

  useEffect(() => { loadCourses() }, [loadCourses])

  const loadData = useCallback(async () => {
    if (!activeCourse) return
    const [pr, vr] = await Promise.all([
      supabase.from('posts').select('*').eq('course_id', activeCourse).order('created_time', { ascending: false }),
      supabase.from('videos').select('*').eq('course_id', activeCourse).order('created_at',   { ascending: false }),
    ])
    setPosts(pr.data  || [])
    setVideos(vr.data || [])
  }, [activeCourse])

  useEffect(() => { loadData() }, [loadData])

  const syncCourse = async () => {
    if (!activeCourse) return
    setSyncing(true); setSyncMsg('')
    try {
      const res  = await fetch('/api/classroom/sync', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ courseId: activeCourse }) })
      const data = await res.json()
      setSyncMsg(data.newPosts > 0 ? `✓ ${data.newPosts} new post(s) added!` : '✓ All caught up!')
      await loadData()
    } catch { setSyncMsg('⚠ Sync failed.') }
    setSyncing(false)
    setTimeout(() => setSyncMsg(''), 4000)
  }

  const handleRename = async (courseId: string, newName: string) => {
    setSaving(true)
    setRenamingId(null)
    await fetch('/api/classroom/update-course', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, customName: newName }),
    })
    setCourses(cs => cs.map(c => c.id === courseId ? { ...c, custom_name: newName.trim() || undefined } : c))
    setSaving(false)
  }

  const handleArchive = async (courseId: string, archived: boolean) => {
    await fetch('/api/classroom/update-course', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, archived }),
    })
    setCourses(cs => cs.map(c => c.id === courseId ? { ...c, archived } : c))
    // If we archived the active course, switch to another
    if (archived && activeCourse === courseId) {
      const next = courses.find(c => c.id !== courseId && !c.archived)
      setActiveCourse(next?.id || null)
    }
  }

  const signOut = async () => { await supabase.auth.signOut(); router.push('/') }

  const activeCourseData = courses.find(c => c.id === activeCourse)
  const displayName      = (c: Course) => c.custom_name || c.name
  const activeName       = activeCourseData ? displayName(activeCourseData) : ''

  const visibleCourses  = courses.filter(c => !c.archived)
  const archivedCourses = courses.filter(c =>  c.archived)

  return (
    <div style={{ fontFamily:"'DM Sans', sans-serif", background:'#F5F0E8', minHeight:'100vh', color:'#0D0D0D', display:'flex', flexDirection:'column' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,700;0,900;1,700&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

        .sidebar-item {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 12px; cursor: pointer; border-radius: 10px;
          margin: 1px 8px; transition: background 0.12s; position: relative;
        }
        .sidebar-item:hover { background: #E0D9CE; }
        .sidebar-item.active { background: #0D0D0D; color: #F5F0E8; }

        .more-btn {
          background: none; border: none; cursor: pointer;
          padding: 3px; border-radius: 5px; display: flex;
          opacity: 0; transition: opacity 0.15s;
          color: inherit;
        }
        .sidebar-item:hover .more-btn,
        .sidebar-item.active .more-btn { opacity: 1; }

        .stat-card {
          background: #EDE8DF; border: 1px solid #D4CCBE;
          border-radius: 16px; padding: 20px 24px; flex: 1;
        }
        .post-row {
          display: flex; align-items: center; gap: 16px;
          background: #EDE8DF; border: 1px solid #D4CCBE;
          border-radius: 14px; padding: 14px 18px; transition: border-color 0.15s;
        }
        .post-row:hover { border-color: #0D0D0D; }
        .video-card {
          background: #EDE8DF; border: 1px solid #D4CCBE;
          border-radius: 18px; overflow: hidden;
          transition: border-color 0.2s, transform 0.2s;
        }
        .video-card:hover { border-color: #0D0D0D; transform: translateY(-2px); }
        .tab-btn {
          padding: 8px 18px; border-radius: 8px; border: none;
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
          cursor: pointer; transition: all 0.15s;
          background: transparent; color: #8C8070;
        }
        .tab-btn.active { background: #0D0D0D; color: #F5F0E8; }
        .tab-btn:hover:not(.active) { color: #0D0D0D; }
        .sync-btn {
          display: flex; align-items: center; gap: 8px;
          background: #0D0D0D; color: #F5F0E8; border: none;
          border-radius: 10px; padding: 10px 18px;
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.15s;
        }
        .sync-btn:hover:not(:disabled) { background: #E85D26; }
        .sync-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .icon-avatar {
          width: 32px; height: 32px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Playfair Display', serif; font-weight: 900;
          font-size: 14px; flex-shrink: 0;
        }
        .section-label {
          font-size: 10px; font-weight: 600; letter-spacing: 0.1em;
          text-transform: uppercase; color: #B0A898;
          padding: 10px 20px 4px;
        }
        .archive-toggle {
          display: flex; align-items: center; gap: 6px;
          background: none; border: none; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 11px;
          color: #8C8070; padding: 6px 20px 8px;
          transition: color 0.15s;
        }
        .archive-toggle:hover { color: #0D0D0D; }
      `}</style>

      {/* ── Topbar ── */}
      <nav style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 32px', borderBottom:'1px solid #D4CCBE', background:'#F5F0E8', position:'sticky', top:0, zIndex:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:9 }}>
          <div style={{ width:28, height:28, background:'#0D0D0D', borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Play size={12} fill="#F5F0E8" color="#F5F0E8"/>
          </div>
          <span style={{ fontFamily:'Playfair Display, serif', fontSize:18, fontWeight:900, letterSpacing:'-0.02em' }}>
            Slide<em style={{ color:'#E85D26' }}>2Learn</em>
          </span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          {user && <span style={{ fontSize:13, color:'#8C8070' }}>{user.email}</span>}
          <button onClick={signOut} style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'1px solid #D4CCBE', borderRadius:8, padding:'7px 14px', fontSize:13, color:'#8C8070', cursor:'pointer', fontFamily:'DM Sans, sans-serif', transition:'all 0.15s' }}>
            <LogOut size={13}/> Sign out
          </button>
        </div>
      </nav>

      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

        {/* ── Sidebar ── */}
        <aside style={{ width:248, borderRight:'1px solid #D4CCBE', background:'#EDE8DF', display:'flex', flexDirection:'column', flexShrink:0, overflowY:'auto' }}>
          {/* Header */}
          <div style={{ padding:'14px 16px 10px', borderBottom:'1px solid #D4CCBE' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontSize:12, fontWeight:600 }}>My Courses</span>
              <button onClick={loadCourses} title="Refresh courses" style={{ background:'none', border:'none', cursor:'pointer', color:'#8C8070', padding:4, borderRadius:6, display:'flex' }}>
                <RefreshCw size={12}/>
              </button>
            </div>
            <span style={{ fontSize:11, color:'#8C8070' }}>Google Classroom</span>
          </div>

          {/* Active courses */}
          <div style={{ flex:1, paddingTop:6 }}>
            {loadingCourses ? (
              <div style={{ display:'flex', justifyContent:'center', padding:32 }}>
                <Loader2 size={18} style={{ animation:'spin 1s linear infinite', color:'#8C8070' }}/>
              </div>
            ) : visibleCourses.length === 0 && !loadingCourses ? (
              <p style={{ fontSize:12, color:'#8C8070', padding:'16px', textAlign:'center', lineHeight:1.6 }}>No active courses.<br/>Sync or unarchive a course.</p>
            ) : (
              <>
                <div className="section-label">Active</div>
                {visibleCourses.map((c, i) => (
                  <div key={c.id} className={`sidebar-item${activeCourse===c.id?' active':''}`}
                    onClick={() => { setActiveCourse(c.id); setMenuOpenId(null) }}>

                    <div className="icon-avatar"
                      style={{ background: activeCourse===c.id ? '#F5F0E8' : COLORS[i % COLORS.length], color: activeCourse===c.id ? '#0D0D0D' : '#F5F0E8' }}>
                      {displayName(c).charAt(0).toUpperCase()}
                    </div>

                    {/* Name or rename input */}
                    {renamingId === c.id ? (
                      <div onClick={e => e.stopPropagation()} style={{ flex:1 }}>
                        <RenameInput
                          value={displayName(c)}
                          onSave={val => handleRename(c.id, val)}
                          onCancel={() => setRenamingId(null)}
                        />
                      </div>
                    ) : (
                      <>
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{displayName(c)}</p>
                          {c.section && <p style={{ fontSize:11, opacity:0.55, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.section}</p>}
                        </div>
                        {activeCourse===c.id && <ChevronRight size={12} style={{ flexShrink:0, opacity:0.4 }}/>}

                        {/* 3-dot menu */}
                        <button className="more-btn" onClick={e => { e.stopPropagation(); setMenuOpenId(menuOpenId===c.id ? null : c.id) }}>
                          <MoreVertical size={13}/>
                        </button>
                        {menuOpenId === c.id && (
                          <CourseMenu
                            course={c}
                            onRename={() => setRenamingId(c.id)}
                            onArchive={() => handleArchive(c.id, true)}
                            onClose={() => setMenuOpenId(null)}
                          />
                        )}
                      </>
                    )}
                  </div>
                ))}
              </>
            )}

            {/* Archived section toggle */}
            {archivedCourses.length > 0 && (
              <>
                <div style={{ borderTop:'1px solid #D4CCBE', margin:'8px 0 0' }}/>
                <button className="archive-toggle" onClick={() => setShowArchived(s => !s)}>
                  {showArchived ? <EyeOff size={12}/> : <Eye size={12}/>}
                  {showArchived ? 'Hide archived' : `Show archived (${archivedCourses.length})`}
                </button>

                {showArchived && (
                  <>
                    <div className="section-label">Archived</div>
                    {archivedCourses.map((c, i) => (
                      <div key={c.id} className={`sidebar-item${activeCourse===c.id?' active':''}`}
                        onClick={() => { setActiveCourse(c.id); setMenuOpenId(null) }}
                        style={{ opacity:0.65 }}>
                        <div className="icon-avatar"
                          style={{ background: activeCourse===c.id ? '#F5F0E8' : '#B0A898', color: activeCourse===c.id ? '#0D0D0D' : '#F5F0E8' }}>
                          {displayName(c).charAt(0).toUpperCase()}
                        </div>
                        {renamingId === c.id ? (
                          <div onClick={e => e.stopPropagation()} style={{ flex:1 }}>
                            <RenameInput
                              value={displayName(c)}
                              onSave={val => handleRename(c.id, val)}
                              onCancel={() => setRenamingId(null)}
                            />
                          </div>
                        ) : (
                          <>
                            <div style={{ flex:1, minWidth:0 }}>
                              <p style={{ fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{displayName(c)}</p>
                            </div>
                            <button className="more-btn" onClick={e => { e.stopPropagation(); setMenuOpenId(menuOpenId===c.id ? null : c.id) }}>
                              <MoreVertical size={13}/>
                            </button>
                            {menuOpenId === c.id && (
                              <CourseMenu
                                course={c}
                                onRename={() => setRenamingId(c.id)}
                                onArchive={() => handleArchive(c.id, false)}
                                onClose={() => setMenuOpenId(null)}
                              />
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>

          {/* Footer tip */}
          <div style={{ padding:'12px 16px', borderTop:'1px solid #D4CCBE' }}>
            <p style={{ fontSize:11, color:'#8C8070', lineHeight:1.6 }}>
              💡 Run <code style={{ background:'#D4CCBE', padding:'1px 5px', borderRadius:4, fontSize:10 }}>notebooklm_worker.py</code> to auto-generate AI videos.
            </p>
          </div>
        </aside>

        {/* ── Main ── */}
        <main style={{ flex:1, overflowY:'auto', padding:'28px 36px' }}>
          {!activeCourseData ? (
            <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12, color:'#8C8070' }}>
              <LayoutGrid size={40} style={{ opacity:0.2 }}/>
              <p style={{ fontWeight:500 }}>Select a course to get started</p>
            </div>
          ) : (
            <>
              {/* Course header */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <div className="icon-avatar" style={{ width:48, height:48, borderRadius:14, background:'#0D0D0D', color:'#F5F0E8', fontSize:20 }}>
                    {activeName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <h1 style={{ fontFamily:'Playfair Display, serif', fontSize:'clamp(20px,3vw,26px)', fontWeight:900, letterSpacing:'-0.02em', lineHeight:1.1 }}>
                        {activeName}
                      </h1>
                      {activeCourseData.custom_name && (
                        <span style={{ fontSize:11, color:'#8C8070', background:'#D4CCBE', padding:'2px 8px', borderRadius:100 }}>renamed</span>
                      )}
                      {activeCourseData.archived && (
                        <span style={{ fontSize:11, color:'#991B1B', background:'#FEF2F2', padding:'2px 8px', borderRadius:100, display:'flex', alignItems:'center', gap:4 }}>
                          <Archive size={10}/> Archived
                        </span>
                      )}
                    </div>
                    {activeCourseData.section && <p style={{ fontSize:13, color:'#8C8070', marginTop:2 }}>{activeCourseData.section}</p>}
                    {activeCourseData.custom_name && (
                      <p style={{ fontSize:11, color:'#B0A898', marginTop:1 }}>Original: {activeCourseData.name}</p>
                    )}
                  </div>
                </div>

                <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                  {syncMsg && <span style={{ fontSize:13, color:'#8C8070' }}>{syncMsg}</span>}

                  {/* Quick rename btn */}
                  <button onClick={() => setRenamingId(activeCourse)} title="Rename course"
                    style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'1px solid #D4CCBE', borderRadius:9, padding:'9px 14px', fontSize:13, color:'#8C8070', cursor:'pointer', fontFamily:'DM Sans, sans-serif', transition:'all 0.15s' }}>
                    <Pencil size={13}/> Rename
                  </button>

                  {/* Archive / Unarchive btn */}
                  <button onClick={() => handleArchive(activeCourse!, !activeCourseData.archived)} title={activeCourseData.archived ? 'Unarchive' : 'Archive'}
                    style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'1px solid #D4CCBE', borderRadius:9, padding:'9px 14px', fontSize:13, color: activeCourseData.archived ? '#065F46' : '#8C8070', cursor:'pointer', fontFamily:'DM Sans, sans-serif', transition:'all 0.15s' }}>
                    {activeCourseData.archived ? <><ArchiveRestore size={13}/> Unarchive</> : <><Archive size={13}/> Archive</>}
                  </button>

                  <button className="sync-btn" onClick={syncCourse} disabled={syncing}>
                    {syncing ? <Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> : <RefreshCw size={14}/>}
                    {syncing ? 'Syncing…' : 'Sync Now'}
                  </button>
                </div>
              </div>

              {/* Inline rename in header */}
              {renamingId === activeCourse && (
                <div style={{ background:'#EDE8DF', border:'1px solid #D4CCBE', borderRadius:12, padding:'12px 16px', marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
                  <Pencil size={14} color="#8C8070"/>
                  <span style={{ fontSize:13, color:'#8C8070', marginRight:4 }}>New name:</span>
                  <RenameInput
                    value={activeCourseData.custom_name || activeCourseData.name}
                    onSave={val => handleRename(activeCourse!, val)}
                    onCancel={() => setRenamingId(null)}
                  />
                </div>
              )}

              {/* Stats */}
              <div style={{ display:'flex', gap:12, marginBottom:24 }}>
                {[
                  { label:'Total Posts',   value:posts.length,                                      icon:<BookOpen size={14}/> },
                  { label:'Videos Ready',  value:videos.filter(v => v.status==='ready').length,     icon:<Video size={14}/> },
                  { label:'Pending',       value:posts.filter(p => p.status==='pending').length,    icon:<Clock size={14}/> },
                ].map(({ label, value, icon }) => (
                  <div key={label} className="stat-card">
                    <div style={{ display:'flex', alignItems:'center', gap:6, color:'#8C8070', marginBottom:8 }}>
                      {icon}<span style={{ fontSize:12, fontWeight:500 }}>{label}</span>
                    </div>
                    <div style={{ fontFamily:'Playfair Display, serif', fontSize:36, fontWeight:900, letterSpacing:'-0.02em' }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Tabs */}
              <div style={{ display:'flex', gap:4, background:'#EDE8DF', border:'1px solid #D4CCBE', borderRadius:12, padding:4, width:'fit-content', marginBottom:20 }}>
                {(['posts','videos'] as const).map(t => (
                  <button key={t} className={`tab-btn${tab===t?' active':''}`} onClick={() => setTab(t)}>
                    {t==='posts' ? `Posts (${posts.length})` : `Videos (${videos.length})`}
                  </button>
                ))}
              </div>

              {/* Posts */}
              {tab==='posts' && (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {posts.length===0 ? (
                    <div style={{ textAlign:'center', padding:'64px 0', color:'#8C8070' }}>
                      <BookOpen size={36} style={{ opacity:0.2, margin:'0 auto 12px', display:'block' }}/>
                      <p style={{ fontWeight:500, marginBottom:4 }}>No posts synced yet</p>
                      <p style={{ fontSize:13 }}>Click "Sync Now" to fetch posts from Classroom</p>
                    </div>
                  ) : posts.map(post => (
                    <div key={post.id} className="post-row">
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontWeight:500, fontSize:14, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:3 }}>{post.title}</p>
                        <p style={{ fontSize:12, color:'#8C8070' }}>
                          {post.post_type} · {post.attachment_count} attachment(s)
                          {post.created_time && ` · ${formatDistanceToNow(new Date(post.created_time), { addSuffix:true })}`}
                        </p>
                      </div>
                      <StatusPill status={post.status}/>
                    </div>
                  ))}
                </div>
              )}

              {/* Videos */}
              {tab==='videos' && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px,1fr))', gap:16 }}>
                  {videos.length===0 ? (
                    <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'64px 0', color:'#8C8070' }}>
                      <Video size={36} style={{ opacity:0.2, margin:'0 auto 12px', display:'block' }}/>
                      <p style={{ fontWeight:500, marginBottom:4 }}>No videos yet</p>
                      <p style={{ fontSize:13 }}>Videos appear here once the worker generates them</p>
                    </div>
                  ) : videos.map(v => (
                    <div key={v.id} className="video-card">
                      <div style={{ aspectRatio:'16/9', background:'#0D0D0D', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
                        {v.status==='ready'
                          ? <Play size={32} fill="#F5F0E8" color="#F5F0E8" style={{ opacity:0.7 }}/>
                          : v.status==='generating'
                          ? <div style={{ textAlign:'center' }}>
                              <Loader2 size={24} style={{ animation:'spin 1s linear infinite', color:'#8C8070', display:'block', margin:'0 auto 8px' }}/>
                              <p style={{ fontSize:12, color:'#8C8070' }}>Generating…</p>
                            </div>
                          : <AlertCircle size={24} color="#EF4444"/>}
                        <div style={{ position:'absolute', top:10, right:10, background:'rgba(245,240,232,0.12)', backdropFilter:'blur(4px)', borderRadius:6, padding:'3px 8px' }}>
                          <span style={{ fontSize:10, color:'#F5F0E8', fontWeight:500 }}>{v.video_style}</span>
                        </div>
                      </div>
                      <div style={{ padding:'14px 16px' }}>
                        <p style={{ fontWeight:600, fontSize:14, marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v.title}</p>
                        <p style={{ fontSize:12, color:'#8C8070', marginBottom:10 }}>{formatDistanceToNow(new Date(v.created_at), { addSuffix:true })}</p>
                        {v.status==='ready' && v.public_url && (
                          <a href={v.public_url} download style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600, color:'#0D0D0D', textDecoration:'none', background:'#D4CCBE', padding:'6px 12px', borderRadius:8 }}>
                            <Download size={12}/> Download MP4
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
