'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  BookOpen, Video, RefreshCw, LogOut, Play, Loader2,
  AlertCircle, Download, LayoutGrid, Pencil, Archive,
  ArchiveRestore, X, Check, MoreVertical, Eye, EyeOff,
  Users, GraduationCap, Tag, Megaphone, ClipboardList,
  FileText, ChevronDown, ChevronRight, ExternalLink, Star,
  MessageSquare, Calendar, Link2, Youtube, FileSpreadsheet,
  Sun, Moon, Menu, ArrowLeft
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

// ── Types ──────────────────────────────────────────────────
type Course      = { id: string; name: string; custom_name?: string; section?: string; room?: string; description?: string; enrollmentCode?: string; archived?: boolean }
type Post        = { id: string; title: string; post_type: string; status: string; attachment_count: number; created_time: string }
type VideoItem   = { id: string; title: string; status: string; public_url?: string; video_style: string; created_at: string }
type Student     = { userId: string; profile?: { name?: { fullName?: string }; emailAddress?: string } }
type Teacher     = { userId: string; profile?: { name?: { fullName?: string }; emailAddress?: string } }
type Topic       = { topicId: string; name: string }
type Announcement = { id: string; text?: string; state?: string; creationTime?: string; materials?: any[]; alternateLink?: string }
type CourseWork  = { id: string; title: string; workType?: string; state?: string; dueDate?: any; maxPoints?: number; description?: string; materials?: any[]; alternateLink?: string; topicId?: string; creationTime?: string }
type Material    = { id: string; title: string; state?: string; materials?: any[]; alternateLink?: string; topicId?: string; creationTime?: string }
type Submission  = { id: string; userId: string; state?: string; late?: boolean; assignedGrade?: number; draftGrade?: number }

// ── Theme ──────────────────────────────────────────────────
type Theme = 'light' | 'dark'
const T = {
  light: {
    bg:         '#F5F0E8',
    sidebar:    '#EDE8DF',
    card:       '#EDE8DF',
    border:     '#D4CCBE',
    borderHov:  '#0D0D0D',
    text:       '#0D0D0D',
    textMuted:  '#8C8070',
    textFaint:  '#B0A898',
    activeItem: '#0D0D0D',
    activeText: '#F5F0E8',
    hoverItem:  '#E0D9CE',
    input:      '#F5F0E8',
    accent:     '#E85D26',
    chipBg:     '#D4CCBE',
    subBorder:  '#E8E2D8',
    navBg:      '#F5F0E8',
    workCard:   '#EDE8DF',
    annCard:    '#EDE8DF',
    pillHov:    '#0D0D0D',
  },
  dark: {
    bg:         '#111110',
    sidebar:    '#1A1917',
    card:       '#1E1D1B',
    border:     '#2E2C28',
    borderHov:  '#F5F0E8',
    text:       '#F0EAE0',
    textMuted:  '#8C8070',
    textFaint:  '#5C5850',
    activeItem: '#F5F0E8',
    activeText: '#0D0D0D',
    hoverItem:  '#252320',
    input:      '#252320',
    accent:     '#E85D26',
    chipBg:     '#2E2C28',
    subBorder:  '#252320',
    navBg:      '#111110',
    workCard:   '#1E1D1B',
    annCard:    '#1E1D1B',
    pillHov:    '#F5F0E8',
  },
}

const COLORS = ['#0D0D0D','#3B3B3B','#5C5C5C','#8C8070','#2D4A6B','#5C3A1E']

function ago(t?: string) { try { return t ? formatDistanceToNow(new Date(t), { addSuffix: true }) : '' } catch { return '' } }
function fmtDate(d?: any) {
  if (!d?.year) return null
  try { return format(new Date(d.year, (d.month||1)-1, d.day||1), 'MMM d, yyyy') } catch { return null }
}

// ── Small components ───────────────────────────────────────
function AttachmentChip({ m }: { m: any }) {
  if (m.driveFile)    return <a href={m.driveFile.driveFile?.alternateLink} target="_blank" rel="noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, background:'#E8E2D8', padding:'4px 10px', borderRadius:100, textDecoration:'none', color:'#0D0D0D', border:'1px solid #D4CCBE', whiteSpace:'nowrap' }}><FileText size={10}/>{m.driveFile.driveFile?.title||'Drive file'}<ExternalLink size={9} style={{opacity:0.5}}/></a>
  if (m.youtubeVideo) return <a href={`https://youtu.be/${m.youtubeVideo.id}`} target="_blank" rel="noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, background:'#FFF3F0', padding:'4px 10px', borderRadius:100, textDecoration:'none', color:'#C00', border:'1px solid #FFCCC5', whiteSpace:'nowrap' }}><Youtube size={10}/>{m.youtubeVideo.title||'YouTube'}<ExternalLink size={9} style={{opacity:0.5}}/></a>
  if (m.link)         return <a href={m.link.url} target="_blank" rel="noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, background:'#EFF6FF', padding:'4px 10px', borderRadius:100, textDecoration:'none', color:'#1D4ED8', border:'1px solid #BFDBFE', whiteSpace:'nowrap' }}><Link2 size={10}/>{m.link.title||m.link.url}<ExternalLink size={9} style={{opacity:0.5}}/></a>
  if (m.form)         return <a href={m.form.formUrl} target="_blank" rel="noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, background:'#F0FDF4', padding:'4px 10px', borderRadius:100, textDecoration:'none', color:'#166534', border:'1px solid #BBF7D0', whiteSpace:'nowrap' }}><FileSpreadsheet size={10}/>{m.form.title||'Form'}<ExternalLink size={9} style={{opacity:0.5}}/></a>
  return null
}

function WorkTypeBadge({ t }: { t?: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    ASSIGNMENT:               { label:'Assignment', bg:'#EFF6FF', color:'#1D4ED8' },
    SHORT_ANSWER_QUESTION:    { label:'Short Q',   bg:'#F0FDF4', color:'#166534' },
    MULTIPLE_CHOICE_QUESTION: { label:'MCQ',       bg:'#FFF7ED', color:'#9A3412' },
  }
  const s = map[t||''] || { label: t||'Item', bg:'#F5F5F5', color:'#6B7280' }
  return <span style={{ fontSize:10, fontWeight:600, background:s.bg, color:s.color, padding:'2px 7px', borderRadius:100, flexShrink:0 }}>{s.label}</span>
}

function StatePill({ state }: { state?: string }) {
  if (!state) return null
  const map: Record<string, { bg: string; color: string }> = {
    PUBLISHED:             { bg:'#ECFDF5', color:'#065F46' },
    DRAFT:                 { bg:'#F5F5F5', color:'#6B7280' },
    DELETED:               { bg:'#FEF2F2', color:'#991B1B' },
    TURNED_IN:             { bg:'#EFF6FF', color:'#1D4ED8' },
    RETURNED:              { bg:'#ECFDF5', color:'#065F46' },
    CREATED:               { bg:'#F5F5F5', color:'#6B7280' },
    NEW:                   { bg:'#EFF6FF', color:'#1D4ED8' },
    RECLAIMED_BY_STUDENT:  { bg:'#FFF7ED', color:'#9A3412' },
  }
  const s = map[state] || { bg:'#F5F5F5', color:'#6B7280' }
  return <span style={{ fontSize:10, fontWeight:600, background:s.bg, color:s.color, padding:'2px 7px', borderRadius:100, flexShrink:0 }}>{state.replace(/_/g,' ')}</span>
}

function Avatar({ name, size=28 }: { name?: string; size?: number }) {
  const initials = (name||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()
  const bg = COLORS[(name||'?').charCodeAt(0) % COLORS.length]
  return <div style={{ width:size, height:size, borderRadius:size/3, background:bg, color:'#F5F0E8', display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*0.38, fontWeight:700, flexShrink:0, fontFamily:'DM Sans,sans-serif' }}>{initials}</div>
}

function RenameInput({ value, onSave, onCancel, th }: { value: string; onSave:(v:string)=>void; onCancel:()=>void; th: typeof T['light'] }) {
  const [val, setVal] = useState(value)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { ref.current?.focus(); ref.current?.select() }, [])
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, flex:1 }}>
      <input ref={ref} value={val} onChange={e=>setVal(e.target.value)}
        onKeyDown={e=>{ if(e.key==='Enter') onSave(val); if(e.key==='Escape') onCancel() }}
        style={{ flex:1, background:th.input, border:`1px solid ${th.text}`, borderRadius:6, padding:'3px 8px', fontSize:13, fontFamily:'DM Sans,sans-serif', color:th.text, outline:'none' }}/>
      <button onClick={()=>onSave(val)} style={{ background:'none', border:'none', cursor:'pointer', color:'#065F46', padding:2, display:'flex' }}><Check size={14}/></button>
      <button onClick={onCancel}        style={{ background:'none', border:'none', cursor:'pointer', color:'#991B1B', padding:2, display:'flex' }}><X size={14}/></button>
    </div>
  )
}

function CourseMenu({ course, onRename, onArchive, onClose, th }: { course:Course; onRename:()=>void; onArchive:()=>void; onClose:()=>void; th: typeof T['light'] }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e:MouseEvent) => { if(ref.current && !ref.current.contains(e.target as Node)) onClose() }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div ref={ref} style={{ position:'absolute', right:8, top:40, background:th.bg, border:`1px solid ${th.border}`, borderRadius:12, boxShadow:'0 8px 30px rgba(0,0,0,0.18)', zIndex:100, minWidth:160, padding:4 }}>
      {[
        { icon:<Pencil size={13} color={th.textMuted}/>, label:'Rename', color:th.text, action:()=>{ onRename(); onClose() } },
        { icon:course.archived?<ArchiveRestore size={13}/>:<Archive size={13}/>, label:course.archived?'Unarchive':'Archive', color:course.archived?'#065F46':'#991B1B', action:()=>{ onArchive(); onClose() } },
      ].map(item => (
        <button key={item.label} onClick={item.action}
          style={{ display:'flex', alignItems:'center', gap:9, width:'100%', padding:'9px 14px', background:'none', border:'none', cursor:'pointer', fontSize:13, fontFamily:'DM Sans,sans-serif', color:item.color, borderRadius:8, textAlign:'left' }}
          onMouseEnter={e=>(e.currentTarget.style.background=th.hoverItem)}
          onMouseLeave={e=>(e.currentTarget.style.background='none')}>
          {item.icon}{item.label}
        </button>
      ))}
    </div>
  )
}

function Section({ title, count, icon, children, defaultOpen=true, th }: { title:string; count?:number; icon:React.ReactNode; children:React.ReactNode; defaultOpen?:boolean; th: typeof T['light'] }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ marginBottom:28 }}>
      <button onClick={()=>setOpen(o=>!o)}
        style={{ display:'flex', alignItems:'center', gap:8, background:'none', border:'none', cursor:'pointer', padding:'0 0 12px', width:'100%', textAlign:'left' }}>
        <span style={{ color:th.textMuted }}>{icon}</span>
        <span style={{ fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:900, letterSpacing:'-0.01em', color:th.text }}>{title}</span>
        {count !== undefined && <span style={{ fontSize:12, color:th.textMuted, background:th.chipBg, padding:'1px 8px', borderRadius:100 }}>{count}</span>}
        <span style={{ marginLeft:'auto', color:th.textMuted }}>{open?<ChevronDown size={15}/>:<ChevronRight size={15}/>}</span>
      </button>
      {open && children}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────
export default function Dashboard() {
  const supabase = createClient()
  const router   = useRouter()

  const [theme,          setTheme]          = useState<Theme>('light')
  const [sidebarOpen,    setSidebarOpen]    = useState(false)
  const [user,           setUser]           = useState<any>(null)
  const [courses,        setCourses]        = useState<Course[]>([])
  const [activeCourse,   setActiveCourse]   = useState<string|null>(null)
  const [syncing,        setSyncing]        = useState(false)
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [syncMsg,        setSyncMsg]        = useState('')
  const [showArchived,   setShowArchived]   = useState(false)
  const [renamingId,     setRenamingId]     = useState<string|null>(null)
  const [menuOpenId,     setMenuOpenId]     = useState<string|null>(null)
  const [tab,            setTab]            = useState<'overview'|'stream'|'work'|'people'|'videos'>('overview')
  const [loading,        setLoading]        = useState(false)
  const [errors,         setErrors]         = useState<Record<string,string>>({})

  const [posts,         setPosts]         = useState<Post[]>([])
  const [videos,        setVideos]        = useState<VideoItem[]>([])
  const [students,      setStudents]      = useState<Student[]>([])
  const [teachers,      setTeachers]      = useState<Teacher[]>([])
  const [topics,        setTopics]        = useState<Topic[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [courseWork,    setCourseWork]    = useState<CourseWork[]>([])
  const [materials,     setMaterials]     = useState<Material[]>([])
  const [submissions,   setSubmissions]   = useState<Record<string, Submission[]>>({})
  const [loadingSub,    setLoadingSub]    = useState<string|null>(null)

  const th = T[theme]

  // Load saved theme
  useEffect(() => {
    const saved = localStorage.getItem('s2l-theme') as Theme|null
    if (saved) setTheme(saved)
  }, [])

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem('s2l-theme', next)
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/'); else setUser(user)
    })
  }, [])

  const loadCourses = useCallback(async () => {
    setLoadingCourses(true)
    const res = await fetch('/api/classroom/courses')
    if (res.ok) {
      const { courses: raw } = await res.json()
      const { data: dbC } = await supabase.from('courses').select('id,custom_name,archived')
      const dbMap = Object.fromEntries((dbC||[]).map((c:any)=>[c.id,c]))
      const merged = (raw||[]).map((c:Course) => ({
        ...c,
        custom_name: dbMap[c.id]?.custom_name ?? undefined,
        archived:    dbMap[c.id]?.archived    ?? false,
      }))
      setCourses(merged)
      if (merged.length>0) setActiveCourse(id => id || merged.find((c:Course)=>!c.archived)?.id || merged[0].id)
    }
    setLoadingCourses(false)
  }, [])

  useEffect(() => { loadCourses() }, [loadCourses])

  const loadCourseData = useCallback(async (courseId: string) => {
    setLoading(true)
    setErrors({})
    setPosts([]); setVideos([]); setStudents([]); setTeachers([])
    setTopics([]); setAnnouncements([]); setCourseWork([]); setMaterials([]); setSubmissions({})

    const safe = async (key: string, fn: () => Promise<void>) => {
      try { await fn() } catch (e: any) { setErrors(prev => ({ ...prev, [key]: e.message })) }
    }

    await Promise.all([
      safe('posts',   async () => { const r = await supabase.from('posts').select('*').eq('course_id', courseId).order('created_time',{ascending:false}); setPosts(r.data||[]) }),
      safe('videos',  async () => { const r = await supabase.from('videos').select('*').eq('course_id', courseId).order('created_at',{ascending:false}); setVideos(r.data||[]) }),
      safe('students', async () => { const r = await fetch(`/api/classroom/students?courseId=${courseId}`); const d = await r.json(); if(d.error) throw new Error(d.error); setStudents(d.students||[]) }),
      safe('teachers', async () => { const r = await fetch(`/api/classroom/teachers?courseId=${courseId}`); const d = await r.json(); if(d.error) throw new Error(d.error); setTeachers(d.teachers||[]) }),
      safe('topics',  async () => { const r = await fetch(`/api/classroom/topics?courseId=${courseId}`); const d = await r.json(); if(d.error) throw new Error(d.error); setTopics(d.topics||[]) }),
      safe('announcements', async () => { const r = await fetch(`/api/classroom/announcements?courseId=${courseId}`); const d = await r.json(); if(d.error) throw new Error(d.error); setAnnouncements(d.announcements||[]) }),
      safe('coursework', async () => { const r = await fetch(`/api/classroom/coursework?courseId=${courseId}`); const d = await r.json(); if(d.error) throw new Error(d.error); setCourseWork(d.courseWork||[]); setMaterials(d.materials||[]) }),
    ])
    setLoading(false)
  }, [])

  useEffect(() => { if (activeCourse) loadCourseData(activeCourse) }, [activeCourse, loadCourseData])

  const loadSubmissions = async (courseWorkId: string) => {
    if (submissions[courseWorkId] !== undefined || loadingSub) return
    setLoadingSub(courseWorkId)
    try {
      const r = await fetch(`/api/classroom/submissions?courseId=${activeCourse}&courseWorkId=${courseWorkId}`)
      const d = await r.json()
      setSubmissions(s=>({ ...s, [courseWorkId]: d.submissions||[] }))
    } catch { setSubmissions(s=>({ ...s, [courseWorkId]: [] })) }
    setLoadingSub(null)
  }

  const syncCourse = async () => {
    if (!activeCourse) return
    setSyncing(true); setSyncMsg('')
    try {
      const res = await fetch('/api/classroom/sync', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ courseId: activeCourse }) })
      const d = await res.json()
      setSyncMsg(d.newPosts>0 ? `✓ ${d.newPosts} new post(s)!` : '✓ Up to date')
      await loadCourseData(activeCourse)
    } catch { setSyncMsg('⚠ Sync failed') }
    setSyncing(false)
    setTimeout(()=>setSyncMsg(''), 4000)
  }

  const handleRename = async (courseId: string, newName: string) => {
    setRenamingId(null)
    await fetch('/api/classroom/update-course', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ courseId, customName: newName }) })
    setCourses(cs=>cs.map(c=>c.id===courseId?{ ...c, custom_name: newName.trim()||undefined }:c))
  }

  const handleArchive = async (courseId: string, archived: boolean) => {
    await fetch('/api/classroom/update-course', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ courseId, archived }) })
    setCourses(cs=>cs.map(c=>c.id===courseId?{ ...c, archived }:c))
    if (archived && activeCourse===courseId) setActiveCourse(courses.find(c=>c.id!==courseId&&!c.archived)?.id||null)
  }

  const signOut = async () => { await supabase.auth.signOut(); router.push('/') }

  const active      = courses.find(c=>c.id===activeCourse)
  const displayName = (c:Course) => c.custom_name || c.name
  const activeName  = active ? displayName(active) : ''
  const visible     = courses.filter(c=>!c.archived)
  const archivedC   = courses.filter(c=> c.archived)
  const topicMap    = Object.fromEntries(topics.map(t=>[t.topicId,t.name]))
  const workByTopic = courseWork.reduce((acc,w)=>{ const k=w.topicId||'__none__'; if(!acc[k]) acc[k]=[]; acc[k].push(w); return acc }, {} as Record<string,CourseWork[]>)

  const TABS = [
    { id:'overview', label:'Overview',  icon:<LayoutGrid size={13}/> },
    { id:'stream',   label:'Stream',    icon:<Megaphone size={13}/> },
    { id:'work',     label:'Classwork', icon:<ClipboardList size={13}/> },
    { id:'people',   label:'People',    icon:<Users size={13}/> },
    { id:'videos',   label:'AI Videos', icon:<Video size={13}/> },
  ] as const

  const SidebarContent = () => (
    <>
      <div style={{ padding:'14px 16px 10px', borderBottom:`1px solid ${th.border}` }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:12, fontWeight:600, color:th.text }}>My Courses</span>
          <button onClick={loadCourses} style={{ background:'none', border:'none', cursor:'pointer', color:th.textMuted, padding:4, borderRadius:6, display:'flex' }}><RefreshCw size={12}/></button>
        </div>
        <span style={{ fontSize:11, color:th.textMuted }}>Google Classroom</span>
      </div>

      <div style={{ flex:1, paddingTop:6, overflowY:'auto' }}>
        {loadingCourses
          ? <div style={{ display:'flex', justifyContent:'center', padding:32 }}><Loader2 size={18} style={{ animation:'spin 1s linear infinite', color:th.textMuted }}/></div>
          : <>
              {visible.length>0 && <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:th.textFaint, padding:'10px 20px 4px' }}>Active ({visible.length})</div>}
              {visible.map((c,i) => (
                <div key={c.id}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', cursor:'pointer', borderRadius:10, margin:'1px 8px', transition:'background 0.12s', position:'relative', background:activeCourse===c.id?th.activeItem:'transparent', color:activeCourse===c.id?th.activeText:th.text }}
                  onClick={()=>{ setActiveCourse(c.id); setMenuOpenId(null); setTab('overview'); setSidebarOpen(false) }}
                  onMouseEnter={e=>{ if(activeCourse!==c.id)(e.currentTarget as HTMLElement).style.background=th.hoverItem }}
                  onMouseLeave={e=>{ if(activeCourse!==c.id)(e.currentTarget as HTMLElement).style.background='transparent' }}>
                  <div style={{ width:32, height:32, borderRadius:9, background:activeCourse===c.id?(theme==='light'?'#F5F0E8':'#0D0D0D'):COLORS[i%COLORS.length], color:activeCourse===c.id?(theme==='light'?'#0D0D0D':'#F5F0E8'):'#F5F0E8', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:900, fontFamily:'Playfair Display,serif', flexShrink:0 }}>
                    {displayName(c).charAt(0).toUpperCase()}
                  </div>
                  {renamingId===c.id
                    ? <div onClick={e=>e.stopPropagation()} style={{ flex:1 }}><RenameInput value={displayName(c)} onSave={v=>handleRename(c.id,v)} onCancel={()=>setRenamingId(null)} th={th}/></div>
                    : <>
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{displayName(c)}</p>
                          {c.section && <p style={{ fontSize:11, opacity:0.55, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.section}</p>}
                        </div>
                        <button
                          style={{ background:'none', border:'none', cursor:'pointer', padding:3, borderRadius:5, display:'flex', color:'inherit', opacity:0 }}
                          className="more-btn"
                          onClick={e=>{ e.stopPropagation(); setMenuOpenId(menuOpenId===c.id?null:c.id) }}><MoreVertical size={13}/></button>
                        {menuOpenId===c.id && <CourseMenu course={c} onRename={()=>setRenamingId(c.id)} onArchive={()=>handleArchive(c.id,true)} onClose={()=>setMenuOpenId(null)} th={th}/>}
                      </>}
                </div>
              ))}

              {archivedC.length>0 && (
                <>
                  <div style={{ borderTop:`1px solid ${th.border}`, margin:'8px 0 0' }}/>
                  <button onClick={()=>setShowArchived(s=>!s)}
                    style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', fontFamily:'DM Sans,sans-serif', fontSize:11, color:th.textMuted, padding:'8px 20px' }}>
                    {showArchived?<EyeOff size={12}/>:<Eye size={12}/>}
                    {showArchived?'Hide archived':`Archived (${archivedC.length})`}
                  </button>
                  {showArchived && archivedC.map(c => (
                    <div key={c.id}
                      style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', cursor:'pointer', borderRadius:10, margin:'1px 8px', opacity:0.6, position:'relative', background:activeCourse===c.id?th.activeItem:'transparent', color:activeCourse===c.id?th.activeText:th.text }}
                      onClick={()=>{ setActiveCourse(c.id); setMenuOpenId(null); setSidebarOpen(false) }}
                      onMouseEnter={e=>{ if(activeCourse!==c.id)(e.currentTarget as HTMLElement).style.background=th.hoverItem }}
                      onMouseLeave={e=>{ if(activeCourse!==c.id)(e.currentTarget as HTMLElement).style.background='transparent' }}>
                      <div style={{ width:32, height:32, borderRadius:9, background:'#8C8070', color:'#F5F0E8', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:900, flexShrink:0 }}>
                        {displayName(c).charAt(0).toUpperCase()}
                      </div>
                      {renamingId===c.id
                        ? <div onClick={e=>e.stopPropagation()} style={{ flex:1 }}><RenameInput value={displayName(c)} onSave={v=>handleRename(c.id,v)} onCancel={()=>setRenamingId(null)} th={th}/></div>
                        : <>
                            <div style={{ flex:1, minWidth:0 }}><p style={{ fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{displayName(c)}</p></div>
                            <button style={{ background:'none', border:'none', cursor:'pointer', padding:3, borderRadius:5, display:'flex', color:'inherit' }} onClick={e=>{ e.stopPropagation(); setMenuOpenId(menuOpenId===c.id?null:c.id) }}><MoreVertical size={13}/></button>
                            {menuOpenId===c.id && <CourseMenu course={c} onRename={()=>setRenamingId(c.id)} onArchive={()=>handleArchive(c.id,false)} onClose={()=>setMenuOpenId(null)} th={th}/>}
                          </>}
                    </div>
                  ))}
                </>
              )}
            </>}
      </div>

      <div style={{ padding:'12px 16px', borderTop:`1px solid ${th.border}` }}>
        <p style={{ fontSize:11, color:th.textMuted, lineHeight:1.6 }}>💡 Run <code style={{ background:th.chipBg, padding:'1px 5px', borderRadius:4, fontSize:10 }}>notebooklm_worker.py</code> to auto-generate AI videos.</p>
      </div>
    </>
  )

  const cardStyle = { background:th.card, border:`1px solid ${th.border}`, borderRadius:16, padding:'16px 20px' }
  const workCardStyle = { background:th.workCard, border:`1px solid ${th.border}`, borderRadius:14, padding:'14px 18px', transition:'border-color 0.15s', cursor:'default' as const }
  const annCardStyle  = { background:th.annCard,  border:`1px solid ${th.border}`, borderRadius:14, padding:'16px 18px' }

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:th.bg, minHeight:'100vh', color:th.text, display:'flex', flexDirection:'column' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,700;0,900;1,700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .spin{animation:spin 1s linear infinite!important;}
        .more-btn{opacity:0;transition:opacity 0.15s;}
        .sb-row:hover .more-btn{opacity:1!important;}
        .sb-row.active-row .more-btn{opacity:1!important;}
        .wcard:hover{border-color:${th.borderHov}!important;}
        .pill-btn{background:none;border:1px solid ${th.border};border-radius:9px;padding:7px 13px;font-size:12px;font-family:'DM Sans',sans-serif;cursor:pointer;display:flex;align-items:center;gap:5px;color:${th.textMuted};transition:all 0.15s;}
        .pill-btn:hover{border-color:${th.borderHov};color:${th.text};}
        .tab-btn{display:flex;align-items:center;gap:6px;padding:9px 14px;border-radius:8px;border:none;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;cursor:pointer;transition:all 0.15s;background:transparent;color:${th.textMuted};white-space:nowrap;}
        .tab-btn.active-tab{background:${th.activeItem};color:${th.activeText};}
        .tab-btn:hover:not(.active-tab){color:${th.text};}
        .sync-btn{display:flex;align-items:center;gap:8px;background:${th.activeItem};color:${th.activeText};border:none;border-radius:10px;padding:10px 18px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.15s;}
        .sync-btn:hover:not(:disabled){background:#E85D26;color:#fff;}
        .sync-btn:disabled{opacity:0.6;cursor:not-allowed;}
        .person-row{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid ${th.subBorder};}
        .person-row:last-child{border-bottom:none;}
        .sub-row{display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid ${th.subBorder};font-size:12px;}
        .sub-row:last-child{border-bottom:none;}
        .mobile-overlay{display:none;}
        @media(max-width:768px){
          .sidebar-desktop{display:none!important;}
          .mobile-overlay{display:block;}
          .main-pad{padding:16px!important;}
          .header-pad{padding:16px 16px 0!important;}
          .stat-grid{grid-template-columns:repeat(2,1fr)!important;}
          .people-grid{grid-template-columns:1fr!important;}
          .tabs-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;}
          .video-grid{grid-template-columns:1fr!important;}
          .header-row{flex-direction:column!important;align-items:flex-start!important;gap:10px!important;}
          .header-actions{flex-wrap:wrap;}
        }
      `}</style>

      {/* Topbar */}
      <nav style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', borderBottom:`1px solid ${th.border}`, background:th.navBg, position:'sticky', top:0, zIndex:30 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {/* Mobile hamburger */}
          <button onClick={()=>setSidebarOpen(true)} style={{ display:'none', background:'none', border:'none', cursor:'pointer', color:th.text, padding:4 }} className="mobile-menu-btn">
            <Menu size={20}/>
          </button>
          <style>{`.mobile-menu-btn{display:none!important;}@media(max-width:768px){.mobile-menu-btn{display:flex!important;}}`}</style>
          <div style={{ width:28, height:28, background:th.activeItem, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Play size={12} fill={th.activeText} color={th.activeText}/>
          </div>
          <span style={{ fontFamily:'Playfair Display,serif', fontSize:18, fontWeight:900, letterSpacing:'-0.02em', color:th.text }}>
            Slide<em style={{ color:'#E85D26' }}>2Learn</em>
          </span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:12, color:th.textMuted, display:'none' }} className="user-email">{user?.email}</span>
          <style>{`@media(min-width:640px){.user-email{display:block!important;}}`}</style>
          {/* Theme toggle */}
          <button onClick={toggleTheme}
            style={{ background:th.card, border:`1px solid ${th.border}`, borderRadius:8, padding:'6px 10px', cursor:'pointer', display:'flex', alignItems:'center', gap:5, color:th.text, fontSize:12, fontFamily:'DM Sans,sans-serif', transition:'all 0.2s' }}>
            {theme==='light' ? <><Moon size={13}/><span style={{display:'none'}} className="theme-label">Dark</span></> : <><Sun size={13}/><span style={{display:'none'}} className="theme-label">Light</span></>}
            <style>{`@media(min-width:640px){.theme-label{display:inline!important;}}`}</style>
          </button>
          <button onClick={signOut} className="pill-btn"><LogOut size={13}/><span style={{display:'none'}} className="so-label">Sign out</span></button>
          <style>{`@media(min-width:640px){.so-label{display:inline!important;}}`}</style>
        </div>
      </nav>

      <div style={{ display:'flex', flex:1, overflow:'hidden', position:'relative' }}>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="mobile-overlay" style={{ position:'fixed', inset:0, zIndex:50, display:'flex' }}>
            <div onClick={()=>setSidebarOpen(false)} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)' }}/>
            <div style={{ position:'relative', width:280, background:th.sidebar, display:'flex', flexDirection:'column', height:'100%', zIndex:51, borderRight:`1px solid ${th.border}` }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderBottom:`1px solid ${th.border}` }}>
                <span style={{ fontSize:13, fontWeight:600, color:th.text }}>Courses</span>
                <button onClick={()=>setSidebarOpen(false)} style={{ background:'none', border:'none', cursor:'pointer', color:th.textMuted, display:'flex' }}><X size={18}/></button>
              </div>
              <SidebarContent/>
            </div>
          </div>
        )}

        {/* Desktop sidebar */}
        <aside className="sidebar-desktop" style={{ width:252, borderRight:`1px solid ${th.border}`, background:th.sidebar, display:'flex', flexDirection:'column', flexShrink:0, overflowY:'auto' }}>
          <SidebarContent/>
        </aside>

        {/* Main */}
        <main style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>
          {!active
            ? <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12, color:th.textMuted }}>
                <LayoutGrid size={40} style={{ opacity:0.2 }}/><p style={{ fontWeight:500 }}>Select a course</p>
              </div>
            : <>
                {/* Course Header */}
                <div className="header-pad" style={{ padding:'20px 32px 0', borderBottom:`1px solid ${th.border}` }}>
                  <div className="header-row" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14, gap:12 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:14, minWidth:0 }}>
                      <div style={{ width:48, height:48, borderRadius:14, background:th.activeItem, color:th.activeText, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:900, fontFamily:'Playfair Display,serif', flexShrink:0 }}>
                        {activeName.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                          <h1 style={{ fontFamily:'Playfair Display,serif', fontSize:'clamp(16px,4vw,24px)', fontWeight:900, letterSpacing:'-0.02em', lineHeight:1.1, color:th.text }}>{activeName}</h1>
                          {active.custom_name && <span style={{ fontSize:10, color:th.textMuted, background:th.chipBg, padding:'2px 7px', borderRadius:100 }}>renamed</span>}
                          {active.archived    && <span style={{ fontSize:10, color:'#991B1B', background:'#FEF2F2', padding:'2px 7px', borderRadius:100 }}>Archived</span>}
                        </div>
                        <div style={{ display:'flex', gap:10, marginTop:3, flexWrap:'wrap' }}>
                          {active.section && <span style={{ fontSize:12, color:th.textMuted }}>{active.section}</span>}
                          {active.room    && <span style={{ fontSize:12, color:th.textMuted }}>Room: {active.room}</span>}
                          {active.enrollmentCode && <span style={{ fontSize:12, color:th.textMuted }}>Code: <strong style={{ color:th.text }}>{active.enrollmentCode}</strong></span>}
                        </div>
                      </div>
                    </div>
                    <div className="header-actions" style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                      {syncMsg && <span style={{ fontSize:12, color:th.textMuted }}>{syncMsg}</span>}
                      <button onClick={()=>setRenamingId(activeCourse)} className="pill-btn"><Pencil size={12}/></button>
                      <button onClick={()=>handleArchive(activeCourse!,!active.archived)} className="pill-btn" style={{ color:active.archived?'#065F46':th.textMuted }}>
                        {active.archived?<ArchiveRestore size={12}/>:<Archive size={12}/>}
                      </button>
                      <button className="sync-btn" onClick={syncCourse} disabled={syncing}>
                        {syncing?<Loader2 size={13} className="spin"/>:<RefreshCw size={13}/>}
                        <span style={{display:'none'}} className="sync-label">{syncing?'Syncing…':'Sync Now'}</span>
                        <style>{`@media(min-width:640px){.sync-label{display:inline!important;}}`}</style>
                      </button>
                    </div>
                  </div>

                  {renamingId===activeCourse && (
                    <div style={{ display:'flex', alignItems:'center', gap:8, background:th.card, border:`1px solid ${th.border}`, borderRadius:10, padding:'10px 14px', marginBottom:12 }}>
                      <Pencil size={13} color={th.textMuted}/>
                      <span style={{ fontSize:12, color:th.textMuted }}>New name:</span>
                      <RenameInput value={active.custom_name||active.name} onSave={v=>handleRename(activeCourse!,v)} onCancel={()=>setRenamingId(null)} th={th}/>
                    </div>
                  )}

                  <div className="tabs-scroll" style={{ display:'flex', gap:2 }}>
                    {TABS.map(t=>(
                      <button key={t.id} className={`tab-btn${tab===t.id?' active-tab':''}`} onClick={()=>setTab(t.id as any)}>
                        {t.icon}<span style={{display:'none'}} className="tab-label">{t.label}</span>
                        <style>{`@media(min-width:480px){.tab-label{display:inline!important;}}`}</style>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div className="main-pad" style={{ flex:1, padding:'24px 32px', overflowY:'auto' }}>
                  {loading
                    ? <div style={{ display:'flex', justifyContent:'center', paddingTop:80 }}><Loader2 size={28} className="spin" style={{ color:th.textMuted }}/></div>
                    : <>

                    {/* OVERVIEW */}
                    {tab==='overview' && (
                      <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                        <div className="stat-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:12 }}>
                          {[
                            { label:'Students',      value:students.length,    icon:<GraduationCap size={14}/> },
                            { label:'Teachers',      value:teachers.length,    icon:<Users size={14}/> },
                            { label:'Assignments',   value:courseWork.filter(w=>w.workType==='ASSIGNMENT').length, icon:<ClipboardList size={14}/> },
                            { label:'Questions',     value:courseWork.filter(w=>w.workType?.includes('QUESTION')).length, icon:<BookOpen size={14}/> },
                            { label:'Topics',        value:topics.length,      icon:<Tag size={14}/> },
                            { label:'Announcements', value:announcements.length, icon:<Megaphone size={14}/> },
                            { label:'Materials',     value:materials.length,   icon:<FileText size={14}/> },
                            { label:'AI Videos',     value:videos.length,      icon:<Video size={14}/> },
                          ].map(({ label, value, icon }) => (
                            <div key={label} style={cardStyle}>
                              <div style={{ display:'flex', alignItems:'center', gap:6, color:th.textMuted, marginBottom:8 }}>{icon}<span style={{ fontSize:11, fontWeight:500 }}>{label}</span></div>
                              <div style={{ fontFamily:'Playfair Display,serif', fontSize:30, fontWeight:900, letterSpacing:'-0.02em', color:th.text }}>{value}</div>
                            </div>
                          ))}
                        </div>
                        {/* Error notices */}
                        {Object.entries(errors).map(([k,v]) => (
                          <div key={k} style={{ background:'#FEF2F2', border:'1px solid #FCA5A5', borderRadius:10, padding:'10px 14px', fontSize:12, color:'#991B1B', display:'flex', gap:8, alignItems:'center' }}>
                            <AlertCircle size={13}/> <strong>{k}:</strong> {v}
                          </div>
                        ))}
                        {active.description && (
                          <div style={cardStyle}>
                            <p style={{ fontSize:11, fontWeight:600, color:th.textMuted, marginBottom:6 }}>About</p>
                            <p style={{ fontSize:13, lineHeight:1.7, color:th.text }}>{active.description}</p>
                          </div>
                        )}
                        {topics.length>0 && (
                          <div style={cardStyle}>
                            <p style={{ fontSize:11, fontWeight:600, color:th.textMuted, marginBottom:10 }}>Topics</p>
                            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                              {topics.map(t=>(
                                <span key={t.topicId} style={{ display:'inline-flex', alignItems:'center', gap:5, background:th.chipBg, color:th.text, padding:'5px 12px', borderRadius:100, fontSize:12, fontWeight:500 }}>
                                  <Tag size={10}/>{t.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {announcements.slice(0,3).length>0 && (
                          <div>
                            <p style={{ fontSize:11, fontWeight:600, color:th.textMuted, marginBottom:10 }}>Recent Announcements ({announcements.length} total)</p>
                            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                              {announcements.slice(0,3).map(a=>(
                                <div key={a.id} style={annCardStyle}>
                                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, flexWrap:'wrap', gap:4 }}>
                                    <StatePill state={a.state}/>
                                    <span style={{ fontSize:11, color:th.textMuted }}>{ago(a.creationTime)}</span>
                                  </div>
                                  <p style={{ fontSize:13, lineHeight:1.6, color:th.text }}>{(a.text||'').slice(0,250)}{(a.text||'').length>250?'…':''}</p>
                                  {(a.materials||[]).length>0&&<div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:8 }}>{(a.materials||[]).map((m:any,i:number)=><AttachmentChip key={i} m={m}/>)}</div>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* STREAM */}
                    {tab==='stream' && (
                      <div style={{ maxWidth:780 }}>
                        <Section title="Announcements" count={announcements.length} icon={<Megaphone size={15}/>} th={th}>
                          {errors.announcements
                            ? <div style={{ background:'#FEF2F2', border:'1px solid #FCA5A5', borderRadius:10, padding:'12px 14px', fontSize:13, color:'#991B1B', display:'flex', gap:8 }}><AlertCircle size={14}/>{errors.announcements}</div>
                            : announcements.length===0
                            ? <p style={{ fontSize:13, color:th.textMuted, padding:'8px 0' }}>No announcements in this course.</p>
                            : <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                                {announcements.map(a=>(
                                  <div key={a.id} style={annCardStyle}>
                                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8, flexWrap:'wrap', gap:6 }}>
                                      <StatePill state={a.state}/>
                                      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                                        <span style={{ fontSize:11, color:th.textMuted }}>{ago(a.creationTime)}</span>
                                        {a.alternateLink && <a href={a.alternateLink} target="_blank" rel="noreferrer" style={{ color:th.textMuted, display:'flex' }}><ExternalLink size={12}/></a>}
                                      </div>
                                    </div>
                                    <p style={{ fontSize:13, lineHeight:1.7, color:th.text, whiteSpace:'pre-wrap', wordBreak:'break-word' }}>{a.text}</p>
                                    {(a.materials||[]).length>0&&<div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:10 }}>{(a.materials||[]).map((m:any,i:number)=><AttachmentChip key={i} m={m}/>)}</div>}
                                  </div>
                                ))}
                              </div>}
                        </Section>

                        <Section title="Synced Posts" count={posts.length} icon={<BookOpen size={15}/>} defaultOpen={false} th={th}>
                          {posts.length===0
                            ? <p style={{ fontSize:13, color:th.textMuted, padding:'8px 0' }}>No synced posts. Click Sync Now.</p>
                            : <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                                {posts.map(p=>(
                                  <div key={p.id} style={{ display:'flex', alignItems:'center', gap:14, background:th.card, border:`1px solid ${th.border}`, borderRadius:12, padding:'12px 16px', flexWrap:'wrap' }}>
                                    <div style={{ flex:1, minWidth:0 }}>
                                      <p style={{ fontWeight:500, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:th.text }}>{p.title}</p>
                                      <p style={{ fontSize:11, color:th.textMuted, marginTop:2 }}>{p.post_type} · {p.attachment_count} attachments · {ago(p.created_time)}</p>
                                    </div>
                                    <span style={{ fontSize:11, fontWeight:600, background:p.status==='done'?'#ECFDF5':'#F5F5F5', color:p.status==='done'?'#065F46':'#6B7280', padding:'3px 9px', borderRadius:100, flexShrink:0 }}>{p.status}</span>
                                  </div>
                                ))}
                              </div>}
                        </Section>
                      </div>
                    )}

                    {/* CLASSWORK */}
                    {tab==='work' && (
                      <div style={{ maxWidth:860 }}>
                        {errors.coursework && <div style={{ background:'#FEF2F2', border:'1px solid #FCA5A5', borderRadius:10, padding:'12px 14px', fontSize:13, color:'#991B1B', display:'flex', gap:8, marginBottom:16 }}><AlertCircle size={14}/>{errors.coursework}</div>}

                        {materials.length>0 && (
                          <Section title="Materials" count={materials.length} icon={<FileText size={15}/>} defaultOpen={false} th={th}>
                            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                              {materials.map(m=>(
                                <div key={m.id} className="wcard" style={workCardStyle}>
                                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10, flexWrap:'wrap' }}>
                                    <div style={{ flex:1, minWidth:0 }}>
                                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                                        <FileText size={13} color={th.textMuted}/><span style={{ fontWeight:500, fontSize:13, color:th.text }}>{m.title}</span><StatePill state={m.state}/>
                                        {m.topicId&&topicMap[m.topicId]&&<span style={{ fontSize:10, color:th.textMuted, background:th.chipBg, padding:'1px 6px', borderRadius:100 }}>{topicMap[m.topicId]}</span>}
                                      </div>
                                      {(m.materials||[]).length>0&&<div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:6 }}>{(m.materials||[]).map((att:any,i:number)=><AttachmentChip key={i} m={att}/>)}</div>}
                                    </div>
                                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 }}>
                                      <span style={{ fontSize:11, color:th.textMuted }}>{ago(m.creationTime)}</span>
                                      {m.alternateLink&&<a href={m.alternateLink} target="_blank" rel="noreferrer" style={{ fontSize:11, color:th.textMuted, display:'flex', gap:4, alignItems:'center', textDecoration:'none' }}><ExternalLink size={11}/> Open</a>}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </Section>
                        )}

                        {courseWork.length===0 && !errors.coursework
                          ? <div style={{ textAlign:'center', padding:'64px 0', color:th.textMuted }}><ClipboardList size={36} style={{ opacity:0.2, margin:'0 auto 12px', display:'block' }}/><p style={{ fontWeight:500 }}>No assignments yet</p></div>
                          : [...topics.map(t=>({ key:t.topicId, label:t.name })), ...(workByTopic['__none__']?[{ key:'__none__', label:'No Topic' }]:[])].map(({ key, label }) => {
                              const items = workByTopic[key]||[]
                              if (!items.length) return null
                              return (
                                <Section key={key} title={label} count={items.length} icon={<Tag size={14}/>} th={th}>
                                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                                    {items.map(w=>{
                                      const subs = submissions[w.id]
                                      return (
                                        <div key={w.id} className="wcard" style={workCardStyle}>
                                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10, flexWrap:'wrap' }}>
                                            <div style={{ flex:1, minWidth:0 }}>
                                              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                                                <WorkTypeBadge t={w.workType}/>
                                                <span style={{ fontWeight:600, fontSize:14, color:th.text }}>{w.title}</span>
                                                <StatePill state={w.state}/>
                                              </div>
                                              {w.description&&<p style={{ fontSize:12, color:th.textMuted, marginBottom:8, lineHeight:1.6 }}>{w.description.slice(0,200)}{w.description.length>200?'…':''}</p>}
                                              {(w.materials||[]).length>0&&<div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:8 }}>{(w.materials||[]).map((m:any,i:number)=><AttachmentChip key={i} m={m}/>)}</div>}
                                              <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                                                {fmtDate(w.dueDate)&&<span style={{ fontSize:11, color:th.textMuted, display:'flex', alignItems:'center', gap:4 }}><Calendar size={10}/> Due {fmtDate(w.dueDate)}</span>}
                                                {w.maxPoints!=null&&<span style={{ fontSize:11, color:th.textMuted, display:'flex', alignItems:'center', gap:4 }}><Star size={10}/> {w.maxPoints} pts</span>}
                                                <span style={{ fontSize:11, color:th.textFaint }}>{ago(w.creationTime)}</span>
                                              </div>
                                            </div>
                                            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6, flexShrink:0 }}>
                                              {w.alternateLink&&<a href={w.alternateLink} target="_blank" rel="noreferrer" style={{ fontSize:11, color:th.textMuted, display:'flex', gap:4, alignItems:'center', textDecoration:'none' }}><ExternalLink size={11}/> Open</a>}
                                              {w.workType==='ASSIGNMENT'&&(
                                                <button onClick={()=>loadSubmissions(w.id)} className="pill-btn" style={{ fontSize:11, padding:'4px 10px' }}>
                                                  {loadingSub===w.id?<Loader2 size={10} className="spin"/>:<MessageSquare size={10}/>}
                                                  {subs!==undefined?`${subs.length} submissions`:'View submissions'}
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                          {subs&&subs.length>0&&(
                                            <div style={{ marginTop:12, borderTop:`1px solid ${th.border}`, paddingTop:10 }}>
                                              <p style={{ fontSize:11, fontWeight:600, color:th.textMuted, marginBottom:8 }}>Submissions ({subs.length})</p>
                                              {subs.map(s=>(
                                                <div key={s.id} className="sub-row">
                                                  <Avatar name={s.userId} size={22}/>
                                                  <span style={{ flex:1, color:th.textMuted, fontSize:11, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.userId}</span>
                                                  <StatePill state={s.state}/>
                                                  {s.late&&<span style={{ fontSize:10, color:'#9A3412', background:'#FFF7ED', padding:'2px 6px', borderRadius:100, fontWeight:600 }}>Late</span>}
                                                  {s.assignedGrade!=null&&<span style={{ fontSize:11, fontWeight:600, color:th.text }}>{s.assignedGrade}/{w.maxPoints??'?'}</span>}
                                                  {s.draftGrade!=null&&s.assignedGrade==null&&<span style={{ fontSize:11, color:th.textMuted }}>Draft: {s.draftGrade}</span>}
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                          {subs!==undefined&&subs.length===0&&<p style={{ fontSize:12, color:th.textMuted, marginTop:8 }}>No submissions yet.</p>}
                                        </div>
                                      )
                                    })}
                                  </div>
                                </Section>
                              )
                            })}
                      </div>
                    )}

                    {/* PEOPLE */}
                    {tab==='people' && (
                      <div className="people-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, alignItems:'start' }}>
                        <div style={cardStyle}>
                          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:14 }}>
                            <Users size={14} color={th.textMuted}/>
                            <span style={{ fontSize:13, fontWeight:600, color:th.text }}>Teachers ({teachers.length})</span>
                          </div>
                          {errors.teachers
                            ? <p style={{ fontSize:12, color:'#991B1B' }}>{errors.teachers}</p>
                            : teachers.length===0
                            ? <p style={{ fontSize:12, color:th.textMuted }}>No teachers found.</p>
                            : teachers.map(t=>(
                                <div key={t.userId} className="person-row">
                                  <Avatar name={t.profile?.name?.fullName} size={36}/>
                                  <div>
                                    <p style={{ fontSize:13, fontWeight:500, color:th.text }}>{t.profile?.name?.fullName||'Unknown'}</p>
                                    <p style={{ fontSize:11, color:th.textMuted }}>{t.profile?.emailAddress||''}</p>
                                  </div>
                                </div>
                              ))}
                        </div>
                        <div style={cardStyle}>
                          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:14 }}>
                            <GraduationCap size={14} color={th.textMuted}/>
                            <span style={{ fontSize:13, fontWeight:600, color:th.text }}>Students ({students.length})</span>
                          </div>
                          {errors.students
                            ? <p style={{ fontSize:12, color:'#991B1B' }}>{errors.students}</p>
                            : students.length===0
                            ? <p style={{ fontSize:12, color:th.textMuted }}>No students enrolled.</p>
                            : <div style={{ maxHeight:480, overflowY:'auto' }}>
                                {students.map(s=>(
                                  <div key={s.userId} className="person-row">
                                    <Avatar name={s.profile?.name?.fullName} size={32}/>
                                    <div>
                                      <p style={{ fontSize:13, fontWeight:500, color:th.text }}>{s.profile?.name?.fullName||'Student'}</p>
                                      <p style={{ fontSize:11, color:th.textMuted }}>{s.profile?.emailAddress||''}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>}
                        </div>
                      </div>
                    )}

                    {/* AI VIDEOS */}
                    {tab==='videos' && (
                      <div>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                          <div>
                            <h2 style={{ fontFamily:'Playfair Display,serif', fontSize:20, fontWeight:900, letterSpacing:'-0.01em', color:th.text }}>AI Video Library</h2>
                            <p style={{ fontSize:12, color:th.textMuted, marginTop:2 }}>{videos.length} video{videos.length!==1?'s':''} from Classroom posts</p>
                          </div>
                        </div>
                        {videos.length===0
                          ? <div style={{ textAlign:'center', padding:'64px 0', color:th.textMuted }}>
                              <Video size={40} style={{ opacity:0.2, margin:'0 auto 12px', display:'block' }}/>
                              <p style={{ fontWeight:500, marginBottom:4 }}>No AI videos yet</p>
                              <p style={{ fontSize:13 }}>Sync posts, then run <code style={{ background:th.chipBg, padding:'1px 6px', borderRadius:4 }}>notebooklm_worker.py</code></p>
                            </div>
                          : <div className="video-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:16 }}>
                              {videos.map(v=>(
                                <div key={v.id} style={{ background:th.card, border:`1px solid ${th.border}`, borderRadius:18, overflow:'hidden', transition:'border-color 0.2s,transform 0.2s', cursor:'pointer' }}>
                                  <div style={{ aspectRatio:'16/9', background:'#0D0D0D', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
                                    {v.status==='ready'?<Play size={32} fill="#F5F0E8" color="#F5F0E8" style={{ opacity:0.7 }}/>:v.status==='generating'?<div style={{ textAlign:'center' }}><Loader2 size={24} className="spin" style={{ color:'#8C8070', display:'block', margin:'0 auto 8px' }}/><p style={{ fontSize:12, color:'#8C8070' }}>Generating…</p></div>:<AlertCircle size={24} color="#EF4444"/>}
                                    <div style={{ position:'absolute', top:10, right:10, background:'rgba(245,240,232,0.12)', backdropFilter:'blur(4px)', borderRadius:6, padding:'3px 8px' }}>
                                      <span style={{ fontSize:10, color:'#F5F0E8', fontWeight:500 }}>{v.video_style}</span>
                                    </div>
                                  </div>
                                  <div style={{ padding:'14px 16px' }}>
                                    <p style={{ fontWeight:600, fontSize:14, marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:th.text }}>{v.title}</p>
                                    <p style={{ fontSize:12, color:th.textMuted, marginBottom:10 }}>{ago(v.created_at)}</p>
                                    {v.status==='ready'&&v.public_url&&(
                                      <a href={v.public_url} download style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600, color:th.text, textDecoration:'none', background:th.chipBg, padding:'6px 12px', borderRadius:8 }}>
                                        <Download size={12}/> Download MP4
                                      </a>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>}
                      </div>
                    )}

                  </>}
                </div>
              </>}
        </main>
      </div>
    </div>
  )
}
