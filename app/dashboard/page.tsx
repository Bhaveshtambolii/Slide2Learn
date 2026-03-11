'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  BookOpen, Video, RefreshCw, LogOut, Play, Loader2,
  CheckCircle2, Clock, AlertCircle, Download, LayoutGrid,
  Pencil, Archive, ArchiveRestore, X, Check, MoreVertical,
  Eye, EyeOff, Users, GraduationCap, Tag, Megaphone,
  ClipboardList, FileText, ChevronDown, ChevronRight,
  ExternalLink, Star, MessageSquare, Calendar, Link2,
  Youtube, FileSpreadsheet
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

type Course    = { id: string; name: string; custom_name?: string; section?: string; room?: string; description?: string; enrollmentCode?: string; archived?: boolean }
type Post      = { id: string; title: string; post_type: string; status: string; attachment_count: number; created_time: string }
type VideoItem = { id: string; title: string; status: string; public_url?: string; video_style: string; created_at: string }
type Student   = { userId: string; profile?: { name?: { fullName?: string }; emailAddress?: string } }
type Teacher   = { userId: string; profile?: { name?: { fullName?: string }; emailAddress?: string } }
type Topic     = { topicId: string; name: string; updateTime?: string }
type Announcement = { id: string; text?: string; state?: string; creationTime?: string; materials?: any[]; alternateLink?: string }
type CourseWork   = { id: string; title: string; workType?: string; state?: string; dueDate?: any; maxPoints?: number; description?: string; materials?: any[]; alternateLink?: string; topicId?: string; creationTime?: string }
type Material     = { id: string; title: string; state?: string; materials?: any[]; alternateLink?: string; topicId?: string; creationTime?: string }
type Submission   = { id: string; userId: string; state?: string; late?: boolean; assignedGrade?: number; draftGrade?: number }

const COLORS = ['#0D0D0D','#3B3B3B','#5C5C5C','#8C8070','#2D4A6B','#5C3A1E']

function ago(t?: string) { return t ? formatDistanceToNow(new Date(t), { addSuffix: true }) : '' }
function fmtDate(d?: any) {
  if (!d) return null
  try { return format(new Date(d.year, (d.month||1)-1, d.day||1), 'MMM d, yyyy') } catch { return null }
}

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
    SHORT_ANSWER_QUESTION:    { label:'Short Q',    bg:'#F0FDF4', color:'#166534' },
    MULTIPLE_CHOICE_QUESTION: { label:'MCQ',        bg:'#FFF7ED', color:'#9A3412' },
  }
  const s = map[t||''] || { label: t||'Item', bg:'#F5F5F5', color:'#6B7280' }
  return <span style={{ fontSize:10, fontWeight:600, background:s.bg, color:s.color, padding:'2px 7px', borderRadius:100 }}>{s.label}</span>
}

function StatePill({ state }: { state?: string }) {
  if (!state) return null
  const map: Record<string, { bg: string; color: string }> = {
    PUBLISHED: { bg:'#ECFDF5', color:'#065F46' },
    DRAFT:     { bg:'#F5F5F5', color:'#6B7280' },
    DELETED:   { bg:'#FEF2F2', color:'#991B1B' },
    TURNED_IN: { bg:'#EFF6FF', color:'#1D4ED8' },
    RETURNED:  { bg:'#ECFDF5', color:'#065F46' },
    CREATED:   { bg:'#F5F5F5', color:'#6B7280' },
    NEW:       { bg:'#EFF6FF', color:'#1D4ED8' },
    RECLAIMED_BY_STUDENT: { bg:'#FFF7ED', color:'#9A3412' },
  }
  const s = map[state] || { bg:'#F5F5F5', color:'#6B7280' }
  return <span style={{ fontSize:10, fontWeight:600, background:s.bg, color:s.color, padding:'2px 7px', borderRadius:100 }}>{state.replace(/_/g,' ')}</span>
}

function Avatar({ name, size=28 }: { name?: string; size?: number }) {
  const initials = (name||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()
  const bg = COLORS[(name||'').charCodeAt(0) % COLORS.length]
  return <div style={{ width:size, height:size, borderRadius:size/3, background:bg, color:'#F5F0E8', display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*0.38, fontWeight:700, flexShrink:0 }}>{initials}</div>
}

function RenameInput({ value, onSave, onCancel }: { value: string; onSave:(v:string)=>void; onCancel:()=>void }) {
  const [val, setVal] = useState(value)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { ref.current?.focus(); ref.current?.select() }, [])
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, flex:1 }}>
      <input ref={ref} value={val} onChange={e=>setVal(e.target.value)}
        onKeyDown={e=>{ if(e.key==='Enter') onSave(val); if(e.key==='Escape') onCancel() }}
        style={{ flex:1, background:'#F5F0E8', border:'1px solid #0D0D0D', borderRadius:6, padding:'3px 8px', fontSize:13, fontFamily:'DM Sans, sans-serif', color:'#0D0D0D', outline:'none' }}/>
      <button onClick={()=>onSave(val)} style={{ background:'none', border:'none', cursor:'pointer', color:'#065F46', padding:2, display:'flex' }}><Check size={14}/></button>
      <button onClick={onCancel}        style={{ background:'none', border:'none', cursor:'pointer', color:'#991B1B', padding:2, display:'flex' }}><X size={14}/></button>
    </div>
  )
}

function CourseMenu({ course, onRename, onArchive, onClose }: { course:Course; onRename:()=>void; onArchive:()=>void; onClose:()=>void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e:MouseEvent) => { if(ref.current && !ref.current.contains(e.target as Node)) onClose() }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  const Item = ({ icon, label, color='#0D0D0D', onClick }: any) => (
    <button onClick={onClick} style={{ display:'flex', alignItems:'center', gap:9, width:'100%', padding:'9px 14px', background:'none', border:'none', cursor:'pointer', fontSize:13, fontFamily:'DM Sans, sans-serif', color, borderRadius:8, textAlign:'left' }}
      onMouseEnter={e=>(e.currentTarget.style.background='#EDE8DF')} onMouseLeave={e=>(e.currentTarget.style.background='none')}>
      {icon}{label}
    </button>
  )
  return (
    <div ref={ref} style={{ position:'absolute', right:8, top:40, background:'#F5F0E8', border:'1px solid #D4CCBE', borderRadius:12, boxShadow:'0 8px 30px rgba(0,0,0,0.12)', zIndex:50, minWidth:160, padding:4 }}>
      <Item icon={<Pencil size={13} color="#8C8070"/>} label="Rename" onClick={()=>{ onRename(); onClose() }}/>
      <Item icon={course.archived?<ArchiveRestore size={13}/>:<Archive size={13}/>} label={course.archived?'Unarchive':'Archive'} color={course.archived?'#065F46':'#991B1B'} onClick={()=>{ onArchive(); onClose() }}/>
    </div>
  )
}

function Section({ title, count, icon, children, defaultOpen=true }: { title:string; count?:number; icon:React.ReactNode; children:React.ReactNode; defaultOpen?:boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ marginBottom:24 }}>
      <button onClick={()=>setOpen(o=>!o)} style={{ display:'flex', alignItems:'center', gap:8, background:'none', border:'none', cursor:'pointer', padding:'0 0 12px', width:'100%', textAlign:'left' }}>
        <span style={{ color:'#8C8070' }}>{icon}</span>
        <span style={{ fontFamily:'Playfair Display, serif', fontSize:17, fontWeight:900, letterSpacing:'-0.01em' }}>{title}</span>
        {count!==undefined && <span style={{ fontSize:12, color:'#8C8070', background:'#D4CCBE', padding:'1px 8px', borderRadius:100 }}>{count}</span>}
        <span style={{ marginLeft:'auto', color:'#8C8070' }}>{open?<ChevronDown size={15}/>:<ChevronRight size={15}/>}</span>
      </button>
      {open && children}
    </div>
  )
}

export default function Dashboard() {
  const supabase = createClient()
  const router   = useRouter()

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
      const merged = (raw||[]).map((c:Course) => ({ ...c, custom_name: dbMap[c.id]?.custom_name??undefined, archived: dbMap[c.id]?.archived??false }))
      setCourses(merged)
      if (merged.length>0) setActiveCourse(id => id || merged.find((c:Course)=>!c.archived)?.id || merged[0].id)
    }
    setLoadingCourses(false)
  }, [])

  useEffect(() => { loadCourses() }, [loadCourses])

  const loadCourseData = useCallback(async (courseId: string) => {
    setLoading(true)
    setPosts([]); setVideos([]); setStudents([]); setTeachers([])
    setTopics([]); setAnnouncements([]); setCourseWork([]); setMaterials([]); setSubmissions({})
    const [pr, vr, sr, tr, tor, ar, wr] = await Promise.allSettled([
      supabase.from('posts').select('*').eq('course_id', courseId).order('created_time',{ascending:false}),
      supabase.from('videos').select('*').eq('course_id', courseId).order('created_at',{ascending:false}),
      fetch(`/api/classroom/students?courseId=${courseId}`).then(r=>r.json()),
      fetch(`/api/classroom/teachers?courseId=${courseId}`).then(r=>r.json()),
      fetch(`/api/classroom/topics?courseId=${courseId}`).then(r=>r.json()),
      fetch(`/api/classroom/announcements?courseId=${courseId}`).then(r=>r.json()),
      fetch(`/api/classroom/coursework?courseId=${courseId}`).then(r=>r.json()),
    ])
    if (pr.status==='fulfilled')  setPosts(pr.value.data||[])
    if (vr.status==='fulfilled')  setVideos(vr.value.data||[])
    if (sr.status==='fulfilled')  setStudents(sr.value.students||[])
    if (tr.status==='fulfilled')  setTeachers(tr.value.teachers||[])
    if (tor.status==='fulfilled') setTopics(tor.value.topics||[])
    if (ar.status==='fulfilled')  setAnnouncements(ar.value.announcements||[])
    if (wr.status==='fulfilled')  { setCourseWork(wr.value.courseWork||[]); setMaterials(wr.value.materials||[]) }
    setLoading(false)
  }, [])

  useEffect(() => { if (activeCourse) loadCourseData(activeCourse) }, [activeCourse, loadCourseData])

  const loadSubmissions = async (courseWorkId: string) => {
    if (submissions[courseWorkId] || loadingSub) return
    setLoadingSub(courseWorkId)
    const r = await fetch(`/api/classroom/submissions?courseId=${activeCourse}&courseWorkId=${courseWorkId}`)
    const d = await r.json()
    setSubmissions(s=>({ ...s, [courseWorkId]: d.submissions||[] }))
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
  const displayName = (c:Course) => c.custom_name||c.name
  const activeName  = active ? displayName(active) : ''
  const visible     = courses.filter(c=>!c.archived)
  const archived    = courses.filter(c=> c.archived)
  const topicMap    = Object.fromEntries(topics.map(t=>[t.topicId,t.name]))
  const workByTopic = courseWork.reduce((acc,w)=>{ const k=w.topicId||'__none__'; if(!acc[k]) acc[k]=[]; acc[k].push(w); return acc }, {} as Record<string,CourseWork[]>)

  const TABS = [
    { id:'overview', label:'Overview',  icon:<LayoutGrid size={13}/> },
    { id:'stream',   label:'Stream',    icon:<Megaphone size={13}/> },
    { id:'work',     label:'Classwork', icon:<ClipboardList size={13}/> },
    { id:'people',   label:'People',    icon:<Users size={13}/> },
    { id:'videos',   label:'AI Videos', icon:<Video size={13}/> },
  ] as const

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:'#F5F0E8', minHeight:'100vh', color:'#0D0D0D', display:'flex', flexDirection:'column' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,700;0,900;1,700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .spin{animation:spin 1s linear infinite}
        .sidebar-item{display:flex;align-items:center;gap:10px;padding:9px 12px;cursor:pointer;border-radius:10px;margin:1px 8px;transition:background 0.12s;position:relative;}
        .sidebar-item:hover{background:#E0D9CE;}
        .sidebar-item.active{background:#0D0D0D;color:#F5F0E8;}
        .more-btn{background:none;border:none;cursor:pointer;padding:3px;border-radius:5px;display:flex;opacity:0;transition:opacity 0.15s;color:inherit;}
        .sidebar-item:hover .more-btn,.sidebar-item.active .more-btn{opacity:1;}
        .tab-btn{display:flex;align-items:center;gap:6px;padding:9px 16px;border-radius:8px;border:none;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;cursor:pointer;transition:all 0.15s;background:transparent;color:#8C8070;white-space:nowrap;}
        .tab-btn.active{background:#0D0D0D;color:#F5F0E8;}
        .tab-btn:hover:not(.active){color:#0D0D0D;}
        .sync-btn{display:flex;align-items:center;gap:8px;background:#0D0D0D;color:#F5F0E8;border:none;border-radius:10px;padding:10px 18px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.15s;}
        .sync-btn:hover:not(:disabled){background:#E85D26;}
        .sync-btn:disabled{opacity:0.6;cursor:not-allowed;}
        .card{background:#EDE8DF;border:1px solid #D4CCBE;border-radius:16px;padding:16px 20px;}
        .work-card{background:#EDE8DF;border:1px solid #D4CCBE;border-radius:14px;padding:14px 18px;transition:border-color 0.15s;}
        .work-card:hover{border-color:#0D0D0D;}
        .ann-card{background:#EDE8DF;border:1px solid #D4CCBE;border-radius:14px;padding:16px 18px;}
        .video-card{background:#EDE8DF;border:1px solid #D4CCBE;border-radius:18px;overflow:hidden;transition:border-color 0.2s,transform 0.2s;}
        .video-card:hover{border-color:#0D0D0D;transform:translateY(-2px);}
        .person-row{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #E8E2D8;}
        .person-row:last-child{border-bottom:none;}
        .sub-row{display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid #E8E2D8;font-size:12px;}
        .sub-row:last-child{border-bottom:none;}
        .section-label{font-size:10px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#B0A898;padding:10px 20px 4px;}
        .pill-btn{background:none;border:1px solid #D4CCBE;border-radius:9px;padding:7px 13px;font-size:12px;font-family:'DM Sans',sans-serif;cursor:pointer;display:flex;align-items:center;gap:5px;color:#8C8070;transition:all 0.15s;}
        .pill-btn:hover{border-color:#0D0D0D;color:#0D0D0D;}
      `}</style>

      {/* Topbar */}
      <nav style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 32px', borderBottom:'1px solid #D4CCBE', background:'#F5F0E8', position:'sticky', top:0, zIndex:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:9 }}>
          <div style={{ width:28, height:28, background:'#0D0D0D', borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Play size={12} fill="#F5F0E8" color="#F5F0E8"/>
          </div>
          <span style={{ fontFamily:'Playfair Display,serif', fontSize:18, fontWeight:900, letterSpacing:'-0.02em' }}>
            Slide<em style={{ color:'#E85D26' }}>2Learn</em>
          </span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          {user && <span style={{ fontSize:13, color:'#8C8070' }}>{user.email}</span>}
          <button onClick={signOut} className="pill-btn"><LogOut size={13}/> Sign out</button>
        </div>
      </nav>

      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        {/* Sidebar */}
        <aside style={{ width:252, borderRight:'1px solid #D4CCBE', background:'#EDE8DF', display:'flex', flexDirection:'column', flexShrink:0, overflowY:'auto' }}>
          <div style={{ padding:'14px 16px 10px', borderBottom:'1px solid #D4CCBE' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontSize:12, fontWeight:600 }}>My Courses</span>
              <button onClick={loadCourses} style={{ background:'none', border:'none', cursor:'pointer', color:'#8C8070', padding:4, borderRadius:6, display:'flex' }}><RefreshCw size={12}/></button>
            </div>
            <span style={{ fontSize:11, color:'#8C8070' }}>Google Classroom</span>
          </div>

          <div style={{ flex:1, paddingTop:6 }}>
            {loadingCourses
              ? <div style={{ display:'flex', justifyContent:'center', padding:32 }}><Loader2 size={18} className="spin" style={{ color:'#8C8070' }}/></div>
              : <>
                  {visible.length>0 && <div className="section-label">Active ({visible.length})</div>}
                  {visible.map((c,i) => (
                    <div key={c.id} className={`sidebar-item${activeCourse===c.id?' active':''}`}
                      onClick={()=>{ setActiveCourse(c.id); setMenuOpenId(null); setTab('overview') }}>
                      <div style={{ width:32, height:32, borderRadius:9, background:activeCourse===c.id?'#F5F0E8':COLORS[i%COLORS.length], color:activeCourse===c.id?'#0D0D0D':'#F5F0E8', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:900, fontFamily:'Playfair Display,serif', flexShrink:0 }}>
                        {displayName(c).charAt(0).toUpperCase()}
                      </div>
                      {renamingId===c.id
                        ? <div onClick={e=>e.stopPropagation()} style={{ flex:1 }}><RenameInput value={displayName(c)} onSave={v=>handleRename(c.id,v)} onCancel={()=>setRenamingId(null)}/></div>
                        : <>
                            <div style={{ flex:1, minWidth:0 }}>
                              <p style={{ fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{displayName(c)}</p>
                              {c.section && <p style={{ fontSize:11, opacity:0.55, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.section}</p>}
                            </div>
                            <button className="more-btn" onClick={e=>{ e.stopPropagation(); setMenuOpenId(menuOpenId===c.id?null:c.id) }}><MoreVertical size={13}/></button>
                            {menuOpenId===c.id && <CourseMenu course={c} onRename={()=>setRenamingId(c.id)} onArchive={()=>handleArchive(c.id,true)} onClose={()=>setMenuOpenId(null)}/>}
                          </>}
                    </div>
                  ))}

                  {archived.length>0 && (
                    <>
                      <div style={{ borderTop:'1px solid #D4CCBE', margin:'8px 0 0' }}/>
                      <button onClick={()=>setShowArchived(s=>!s)} style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', fontFamily:'DM Sans,sans-serif', fontSize:11, color:'#8C8070', padding:'8px 20px' }}>
                        {showArchived?<EyeOff size={12}/>:<Eye size={12}/>}
                        {showArchived?'Hide archived':`Archived (${archived.length})`}
                      </button>
                      {showArchived && archived.map(c => (
                        <div key={c.id} className={`sidebar-item${activeCourse===c.id?' active':''}`} style={{ opacity:0.6 }}
                          onClick={()=>{ setActiveCourse(c.id); setMenuOpenId(null) }}>
                          <div style={{ width:32, height:32, borderRadius:9, background:'#B0A898', color:'#F5F0E8', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:900, flexShrink:0 }}>
                            {displayName(c).charAt(0).toUpperCase()}
                          </div>
                          {renamingId===c.id
                            ? <div onClick={e=>e.stopPropagation()} style={{ flex:1 }}><RenameInput value={displayName(c)} onSave={v=>handleRename(c.id,v)} onCancel={()=>setRenamingId(null)}/></div>
                            : <>
                                <div style={{ flex:1, minWidth:0 }}><p style={{ fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{displayName(c)}</p></div>
                                <button className="more-btn" onClick={e=>{ e.stopPropagation(); setMenuOpenId(menuOpenId===c.id?null:c.id) }}><MoreVertical size={13}/></button>
                                {menuOpenId===c.id && <CourseMenu course={c} onRename={()=>setRenamingId(c.id)} onArchive={()=>handleArchive(c.id,false)} onClose={()=>setMenuOpenId(null)}/>}
                              </>}
                        </div>
                      ))}
                    </>
                  )}
                </>}
          </div>
          <div style={{ padding:'12px 16px', borderTop:'1px solid #D4CCBE' }}>
            <p style={{ fontSize:11, color:'#8C8070', lineHeight:1.6 }}>💡 Run <code style={{ background:'#D4CCBE', padding:'1px 5px', borderRadius:4, fontSize:10 }}>notebooklm_worker.py</code> to auto-generate AI videos.</p>
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>
          {!active
            ? <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12, color:'#8C8070' }}>
                <LayoutGrid size={40} style={{ opacity:0.2 }}/><p style={{ fontWeight:500 }}>Select a course</p>
              </div>
            : <>
                {/* Header */}
                <div style={{ padding:'24px 36px 0', borderBottom:'1px solid #D4CCBE' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:12 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                      <div style={{ width:52, height:52, borderRadius:14, background:'#0D0D0D', color:'#F5F0E8', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:900, fontFamily:'Playfair Display,serif', flexShrink:0 }}>
                        {activeName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                          <h1 style={{ fontFamily:'Playfair Display,serif', fontSize:'clamp(18px,3vw,24px)', fontWeight:900, letterSpacing:'-0.02em', lineHeight:1.1 }}>{activeName}</h1>
                          {active.custom_name && <span style={{ fontSize:10, color:'#8C8070', background:'#D4CCBE', padding:'2px 7px', borderRadius:100 }}>renamed</span>}
                          {active.archived    && <span style={{ fontSize:10, color:'#991B1B', background:'#FEF2F2', padding:'2px 7px', borderRadius:100 }}>Archived</span>}
                        </div>
                        <div style={{ display:'flex', gap:12, marginTop:4, flexWrap:'wrap' }}>
                          {active.section && <span style={{ fontSize:12, color:'#8C8070' }}>{active.section}</span>}
                          {active.room    && <span style={{ fontSize:12, color:'#8C8070' }}>Room: {active.room}</span>}
                          {active.enrollmentCode && <span style={{ fontSize:12, color:'#8C8070' }}>Code: <strong style={{ color:'#0D0D0D' }}>{active.enrollmentCode}</strong></span>}
                        </div>
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                      {syncMsg && <span style={{ fontSize:13, color:'#8C8070' }}>{syncMsg}</span>}
                      <button onClick={()=>setRenamingId(activeCourse)} className="pill-btn"><Pencil size={12}/> Rename</button>
                      <button onClick={()=>handleArchive(activeCourse!,!active.archived)} className="pill-btn" style={{ color:active.archived?'#065F46':'#8C8070' }}>
                        {active.archived?<><ArchiveRestore size={12}/> Unarchive</>:<><Archive size={12}/> Archive</>}
                      </button>
                      <button className="sync-btn" onClick={syncCourse} disabled={syncing}>
                        {syncing?<Loader2 size={13} className="spin"/>:<RefreshCw size={13}/>}
                        {syncing?'Syncing…':'Sync Now'}
                      </button>
                    </div>
                  </div>

                  {renamingId===activeCourse && (
                    <div style={{ display:'flex', alignItems:'center', gap:8, background:'#EDE8DF', border:'1px solid #D4CCBE', borderRadius:10, padding:'10px 14px', marginBottom:12 }}>
                      <Pencil size={13} color="#8C8070"/>
                      <span style={{ fontSize:12, color:'#8C8070' }}>New name:</span>
                      <RenameInput value={active.custom_name||active.name} onSave={v=>handleRename(activeCourse!,v)} onCancel={()=>setRenamingId(null)}/>
                    </div>
                  )}

                  <div style={{ display:'flex', gap:2, overflowX:'auto' }}>
                    {TABS.map(t=>(
                      <button key={t.id} className={`tab-btn${tab===t.id?' active':''}`} onClick={()=>setTab(t.id as any)}>
                        {t.icon}{t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div style={{ flex:1, padding:'28px 36px', overflowY:'auto' }}>
                  {loading
                    ? <div style={{ display:'flex', justifyContent:'center', paddingTop:80 }}><Loader2 size={28} className="spin" style={{ color:'#8C8070' }}/></div>
                    : <>

                    {/* OVERVIEW */}
                    {tab==='overview' && (
                      <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:12 }}>
                          {[
                            { label:'Students',      value:students.length,                                       icon:<GraduationCap size={14}/> },
                            { label:'Teachers',      value:teachers.length,                                       icon:<Users size={14}/> },
                            { label:'Assignments',   value:courseWork.filter(w=>w.workType==='ASSIGNMENT').length, icon:<ClipboardList size={14}/> },
                            { label:'Questions',     value:courseWork.filter(w=>w.workType?.includes('QUESTION')).length, icon:<BookOpen size={14}/> },
                            { label:'Topics',        value:topics.length,                                         icon:<Tag size={14}/> },
                            { label:'Announcements', value:announcements.length,                                  icon:<Megaphone size={14}/> },
                            { label:'Materials',     value:materials.length,                                      icon:<FileText size={14}/> },
                            { label:'AI Videos',     value:videos.length,                                         icon:<Video size={14}/> },
                          ].map(({ label, value, icon }) => (
                            <div key={label} className="card">
                              <div style={{ display:'flex', alignItems:'center', gap:6, color:'#8C8070', marginBottom:8 }}>{icon}<span style={{ fontSize:11, fontWeight:500 }}>{label}</span></div>
                              <div style={{ fontFamily:'Playfair Display,serif', fontSize:30, fontWeight:900, letterSpacing:'-0.02em' }}>{value}</div>
                            </div>
                          ))}
                        </div>

                        {active.description && (
                          <div className="card">
                            <p style={{ fontSize:11, fontWeight:600, color:'#8C8070', marginBottom:6 }}>About</p>
                            <p style={{ fontSize:13, lineHeight:1.7, color:'#3B3B3B' }}>{active.description}</p>
                          </div>
                        )}

                        {topics.length>0 && (
                          <div className="card">
                            <p style={{ fontSize:11, fontWeight:600, color:'#8C8070', marginBottom:10 }}>Topics</p>
                            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                              {topics.map(t=>(
                                <span key={t.topicId} style={{ display:'inline-flex', alignItems:'center', gap:5, background:'#D4CCBE', color:'#0D0D0D', padding:'5px 12px', borderRadius:100, fontSize:12, fontWeight:500 }}>
                                  <Tag size={10}/>{t.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {announcements.slice(0,2).length>0 && (
                          <div>
                            <p style={{ fontSize:11, fontWeight:600, color:'#8C8070', marginBottom:10 }}>Recent Announcements</p>
                            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                              {announcements.slice(0,2).map(a=>(
                                <div key={a.id} className="ann-card">
                                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}><StatePill state={a.state}/><span style={{ fontSize:11, color:'#8C8070' }}>{ago(a.creationTime)}</span></div>
                                  <p style={{ fontSize:13, lineHeight:1.6, color:'#3B3B3B' }}>{(a.text||'').slice(0,200)}{(a.text||'').length>200?'…':''}</p>
                                  {(a.materials||[]).length>0 && <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:8 }}>{(a.materials||[]).map((m:any,i:number)=><AttachmentChip key={i} m={m}/>)}</div>}
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
                        <Section title="Announcements" count={announcements.length} icon={<Megaphone size={15}/>}>
                          {announcements.length===0
                            ? <p style={{ fontSize:13, color:'#8C8070', padding:'8px 0' }}>No announcements.</p>
                            : <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                                {announcements.map(a=>(
                                  <div key={a.id} className="ann-card">
                                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                                      <StatePill state={a.state}/>
                                      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                                        <span style={{ fontSize:11, color:'#8C8070' }}>{ago(a.creationTime)}</span>
                                        {a.alternateLink && <a href={a.alternateLink} target="_blank" rel="noreferrer" style={{ color:'#8C8070', display:'flex' }}><ExternalLink size={12}/></a>}
                                      </div>
                                    </div>
                                    <p style={{ fontSize:13, lineHeight:1.7, color:'#3B3B3B', whiteSpace:'pre-wrap' }}>{a.text}</p>
                                    {(a.materials||[]).length>0 && <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:10 }}>{(a.materials||[]).map((m:any,i:number)=><AttachmentChip key={i} m={m}/>)}</div>}
                                  </div>
                                ))}
                              </div>}
                        </Section>

                        <Section title="Synced Posts" count={posts.length} icon={<BookOpen size={15}/>} defaultOpen={false}>
                          {posts.length===0
                            ? <p style={{ fontSize:13, color:'#8C8070', padding:'8px 0' }}>No synced posts. Click Sync Now.</p>
                            : <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                                {posts.map(p=>(
                                  <div key={p.id} style={{ display:'flex', alignItems:'center', gap:14, background:'#EDE8DF', border:'1px solid #D4CCBE', borderRadius:12, padding:'12px 16px' }}>
                                    <div style={{ flex:1, minWidth:0 }}>
                                      <p style={{ fontWeight:500, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.title}</p>
                                      <p style={{ fontSize:11, color:'#8C8070', marginTop:2 }}>{p.post_type} · {p.attachment_count} attachments · {ago(p.created_time)}</p>
                                    </div>
                                    <span style={{ fontSize:11, fontWeight:600, background:p.status==='done'?'#ECFDF5':'#F5F5F5', color:p.status==='done'?'#065F46':'#6B7280', padding:'3px 9px', borderRadius:100 }}>{p.status}</span>
                                  </div>
                                ))}
                              </div>}
                        </Section>
                      </div>
                    )}

                    {/* CLASSWORK */}
                    {tab==='work' && (
                      <div style={{ maxWidth:860 }}>
                        {materials.length>0 && (
                          <Section title="Materials" count={materials.length} icon={<FileText size={15}/>} defaultOpen={false}>
                            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                              {materials.map(m=>(
                                <div key={m.id} className="work-card">
                                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10 }}>
                                    <div style={{ flex:1 }}>
                                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                                        <FileText size={13} color="#8C8070"/>
                                        <span style={{ fontWeight:500, fontSize:13 }}>{m.title}</span>
                                        <StatePill state={m.state}/>
                                        {m.topicId&&topicMap[m.topicId]&&<span style={{ fontSize:10, color:'#8C8070', background:'#D4CCBE', padding:'1px 6px', borderRadius:100 }}>{topicMap[m.topicId]}</span>}
                                      </div>
                                      {(m.materials||[]).length>0&&<div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:6 }}>{(m.materials||[]).map((att:any,i:number)=><AttachmentChip key={i} m={att}/>)}</div>}
                                    </div>
                                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 }}>
                                      <span style={{ fontSize:11, color:'#8C8070' }}>{ago(m.creationTime)}</span>
                                      {m.alternateLink&&<a href={m.alternateLink} target="_blank" rel="noreferrer" style={{ fontSize:11, color:'#8C8070', display:'flex', gap:4, alignItems:'center', textDecoration:'none' }}><ExternalLink size={11}/> Open</a>}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </Section>
                        )}

                        {courseWork.length===0
                          ? <div style={{ textAlign:'center', padding:'64px 0', color:'#8C8070' }}><ClipboardList size={36} style={{ opacity:0.2, margin:'0 auto 12px', display:'block' }}/><p style={{ fontWeight:500 }}>No assignments yet</p></div>
                          : [...topics.map(t=>({ key:t.topicId, label:t.name })), ...(workByTopic['__none__']?[{ key:'__none__', label:'No Topic' }]:[])].map(({ key, label }) => {
                              const items = workByTopic[key]||[]
                              if (!items.length) return null
                              return (
                                <Section key={key} title={label} count={items.length} icon={<Tag size={14}/>}>
                                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                                    {items.map(w=>{
                                      const subs = submissions[w.id]
                                      return (
                                        <div key={w.id} className="work-card">
                                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10 }}>
                                            <div style={{ flex:1 }}>
                                              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                                                <WorkTypeBadge t={w.workType}/>
                                                <span style={{ fontWeight:600, fontSize:14 }}>{w.title}</span>
                                                <StatePill state={w.state}/>
                                              </div>
                                              {w.description&&<p style={{ fontSize:12, color:'#5C5C5C', marginBottom:8, lineHeight:1.6 }}>{w.description.slice(0,200)}{w.description.length>200?'…':''}</p>}
                                              {(w.materials||[]).length>0&&<div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:8 }}>{(w.materials||[]).map((m:any,i:number)=><AttachmentChip key={i} m={m}/>)}</div>}
                                              <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                                                {fmtDate(w.dueDate)&&<span style={{ fontSize:11, color:'#8C8070', display:'flex', alignItems:'center', gap:4 }}><Calendar size={10}/> Due {fmtDate(w.dueDate)}</span>}
                                                {w.maxPoints!=null&&<span style={{ fontSize:11, color:'#8C8070', display:'flex', alignItems:'center', gap:4 }}><Star size={10}/> {w.maxPoints} pts</span>}
                                                <span style={{ fontSize:11, color:'#8C8070' }}>{ago(w.creationTime)}</span>
                                              </div>
                                            </div>
                                            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6, flexShrink:0 }}>
                                              {w.alternateLink&&<a href={w.alternateLink} target="_blank" rel="noreferrer" style={{ fontSize:11, color:'#8C8070', display:'flex', gap:4, alignItems:'center', textDecoration:'none' }}><ExternalLink size={11}/> Open</a>}
                                              {w.workType==='ASSIGNMENT'&&(
                                                <button onClick={()=>loadSubmissions(w.id)} className="pill-btn" style={{ fontSize:11, padding:'4px 10px' }}>
                                                  {loadingSub===w.id?<Loader2 size={10} className="spin"/>:<MessageSquare size={10}/>}
                                                  {subs?`${subs.length} submissions`:'View submissions'}
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                          {subs&&subs.length>0&&(
                                            <div style={{ marginTop:12, borderTop:'1px solid #D4CCBE', paddingTop:10 }}>
                                              <p style={{ fontSize:11, fontWeight:600, color:'#8C8070', marginBottom:8 }}>Submissions ({subs.length})</p>
                                              {subs.map(s=>(
                                                <div key={s.id} className="sub-row">
                                                  <Avatar name={s.userId} size={22}/>
                                                  <span style={{ flex:1, color:'#5C5C5C', fontSize:11 }}>{s.userId.slice(0,14)}…</span>
                                                  <StatePill state={s.state}/>
                                                  {s.late&&<span style={{ fontSize:10, color:'#9A3412', background:'#FFF7ED', padding:'2px 6px', borderRadius:100, fontWeight:600 }}>Late</span>}
                                                  {s.assignedGrade!=null&&<span style={{ fontSize:11, fontWeight:600 }}>{s.assignedGrade}/{w.maxPoints??'?'}</span>}
                                                  {s.draftGrade!=null&&s.assignedGrade==null&&<span style={{ fontSize:11, color:'#8C8070' }}>Draft: {s.draftGrade}</span>}
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                          {subs&&subs.length===0&&<p style={{ fontSize:12, color:'#8C8070', marginTop:8 }}>No submissions yet.</p>}
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
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, alignItems:'start' }}>
                        <div className="card" style={{ padding:'16px 20px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:12 }}>
                            <Users size={14} color="#8C8070"/>
                            <span style={{ fontSize:13, fontWeight:600 }}>Teachers ({teachers.length})</span>
                          </div>
                          {teachers.length===0
                            ? <p style={{ fontSize:12, color:'#8C8070' }}>No teachers found.</p>
                            : teachers.map(t=>(
                                <div key={t.userId} className="person-row">
                                  <Avatar name={t.profile?.name?.fullName} size={34}/>
                                  <div>
                                    <p style={{ fontSize:13, fontWeight:500 }}>{t.profile?.name?.fullName||'Unknown'}</p>
                                    <p style={{ fontSize:11, color:'#8C8070' }}>{t.profile?.emailAddress||''}</p>
                                  </div>
                                </div>
                              ))}
                        </div>
                        <div className="card" style={{ padding:'16px 20px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:12 }}>
                            <GraduationCap size={14} color="#8C8070"/>
                            <span style={{ fontSize:13, fontWeight:600 }}>Students ({students.length})</span>
                          </div>
                          {students.length===0
                            ? <p style={{ fontSize:12, color:'#8C8070' }}>No students enrolled.</p>
                            : <div style={{ maxHeight:480, overflowY:'auto' }}>
                                {students.map(s=>(
                                  <div key={s.userId} className="person-row">
                                    <Avatar name={s.profile?.name?.fullName} size={30}/>
                                    <div>
                                      <p style={{ fontSize:13, fontWeight:500 }}>{s.profile?.name?.fullName||'Student'}</p>
                                      <p style={{ fontSize:11, color:'#8C8070' }}>{s.profile?.emailAddress||''}</p>
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
                            <h2 style={{ fontFamily:'Playfair Display,serif', fontSize:20, fontWeight:900, letterSpacing:'-0.01em' }}>AI Video Library</h2>
                            <p style={{ fontSize:12, color:'#8C8070', marginTop:2 }}>{videos.length} video{videos.length!==1?'s':''} from Classroom posts</p>
                          </div>
                        </div>
                        {videos.length===0
                          ? <div style={{ textAlign:'center', padding:'64px 0', color:'#8C8070' }}>
                              <Video size={40} style={{ opacity:0.2, margin:'0 auto 12px', display:'block' }}/>
                              <p style={{ fontWeight:500, marginBottom:4 }}>No AI videos yet</p>
                              <p style={{ fontSize:13 }}>Sync posts, then run <code style={{ background:'#D4CCBE', padding:'1px 6px', borderRadius:4 }}>notebooklm_worker.py</code></p>
                            </div>
                          : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:16 }}>
                              {videos.map(v=>(
                                <div key={v.id} className="video-card">
                                  <div style={{ aspectRatio:'16/9', background:'#0D0D0D', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
                                    {v.status==='ready'?<Play size={32} fill="#F5F0E8" color="#F5F0E8" style={{ opacity:0.7 }}/>:v.status==='generating'?<div style={{ textAlign:'center' }}><Loader2 size={24} className="spin" style={{ color:'#8C8070', display:'block', margin:'0 auto 8px' }}/><p style={{ fontSize:12, color:'#8C8070' }}>Generating…</p></div>:<AlertCircle size={24} color="#EF4444"/>}
                                    <div style={{ position:'absolute', top:10, right:10, background:'rgba(245,240,232,0.12)', backdropFilter:'blur(4px)', borderRadius:6, padding:'3px 8px' }}>
                                      <span style={{ fontSize:10, color:'#F5F0E8', fontWeight:500 }}>{v.video_style}</span>
                                    </div>
                                  </div>
                                  <div style={{ padding:'14px 16px' }}>
                                    <p style={{ fontWeight:600, fontSize:14, marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v.title}</p>
                                    <p style={{ fontSize:12, color:'#8C8070', marginBottom:10 }}>{ago(v.created_at)}</p>
                                    {v.status==='ready'&&v.public_url&&(
                                      <a href={v.public_url} download style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600, color:'#0D0D0D', textDecoration:'none', background:'#D4CCBE', padding:'6px 12px', borderRadius:8 }}>
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
