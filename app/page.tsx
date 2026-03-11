'use client'
import { useState } from 'react'
import { ArrowRight, Loader2, Play, Zap, BookOpen, Video, Shield } from 'lucide-react'

export default function LandingPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function signInWithGoogle() {
    setLoading(true)
    setError('')
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${location.origin}/auth/callback`,
          scopes: [
            'https://www.googleapis.com/auth/classroom.announcements.readonly',
            'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
            'https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly',
            'https://www.googleapis.com/auth/classroom.courses.readonly',
            'https://www.googleapis.com/auth/drive.readonly',
          ].join(' '),
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      })
      if (error) { setError(error.message); setLoading(false) }
    } catch (e: any) { setError(e.message); setLoading(false) }
  }

  const features = [
    { icon: Zap,      title: 'Auto-Detect',         desc: 'Watches your Classroom for new announcements, assignments, and slide uploads the moment they appear.' },
    { icon: BookOpen, title: 'NotebookLM Sync',      desc: 'Creates a dedicated AI notebook for each post and uploads every attachment as a source automatically.' },
    { icon: Video,    title: 'AI Video Generation',  desc: 'Converts slides and PDFs into a clear, engaging video explanation — no effort required from you.' },
    { icon: Shield,   title: 'Class-wise Storage',   desc: 'Every video neatly stored by course in Supabase. Stream or download any explanation in one click.' },
  ]

  return (
    <main style={{ fontFamily: "'DM Sans', sans-serif", background: '#F5F0E8', minHeight: '100vh', color: '#0D0D0D' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .nav-btn {
          background: transparent;
          border: 1px solid #D4CCBE;
          color: #8C8070;
          border-radius: 8px;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.15s;
        }
        .nav-btn:hover { border-color: #0D0D0D; color: #0D0D0D; }

        .google-btn {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          background: #0D0D0D;
          color: #F5F0E8;
          border: none;
          border-radius: 14px;
          padding: 15px 28px;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .google-btn:hover:not(:disabled) {
          background: #E85D26;
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(232,93,38,0.25);
        }
        .google-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #EDE8DF;
          border: 1px solid #D4CCBE;
          border-radius: 100px;
          padding: 6px 14px;
          font-size: 12px;
          font-weight: 500;
          color: #8C8070;
        }
        .badge-dot {
          width: 6px; height: 6px;
          background: #E85D26;
          border-radius: 50%;
          animation: blink 1.8s ease-in-out infinite;
        }
        @keyframes blink {
          0%,100% { opacity:1; } 50% { opacity:0.3; }
        }

        .feature-card {
          background: #F5F0E8;
          border: 1px solid #D4CCBE;
          border-radius: 20px;
          padding: 28px;
          transition: border-color 0.2s, transform 0.2s;
        }
        .feature-card:hover {
          border-color: #0D0D0D;
          transform: translateY(-2px);
        }

        .icon-box {
          width: 44px; height: 44px;
          background: #0D0D0D;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 16px;
        }

        .step-row {
          display: flex;
          gap: 20px;
          align-items: flex-start;
          padding: 24px 0;
          border-bottom: 1px solid #E8E2D8;
        }
        .step-num {
          width: 40px; height: 40px;
          border: 1.5px solid #D4CCBE;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Playfair Display', serif;
          font-weight: 700;
          font-size: 15px;
          color: #8C8070;
          flex-shrink: 0;
        }

        @keyframes fadeUp {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .fade-up { animation: fadeUp 0.6s ease forwards; }
        .d1 { animation-delay: 0.05s; opacity:0; }
        .d2 { animation-delay: 0.15s; opacity:0; }
        .d3 { animation-delay: 0.25s; opacity:0; }
        .d4 { animation-delay: 0.35s; opacity:0; }
      `}</style>

      {/* ── Navbar ── */}
      <nav style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 48px', borderBottom:'1px solid #D4CCBE', background:'#F5F0E8' }}>
        <div style={{ display:'flex', alignItems:'center', gap:9 }}>
          <div style={{ width:30, height:30, background:'#0D0D0D', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Play size={13} fill="#F5F0E8" color="#F5F0E8" />
          </div>
          <span style={{ fontFamily:'Playfair Display, serif', fontSize:20, fontWeight:900, letterSpacing:'-0.02em' }}>
            Slide<span style={{ fontStyle:'italic', color:'#E85D26' }}>2Learn</span>
          </span>
        </div>
        <button className="nav-btn" onClick={signInWithGoogle} disabled={loading}>
          Sign in →
        </button>
      </nav>

      {/* ── Hero ── */}
      <section style={{ maxWidth:760, margin:'0 auto', padding:'80px 40px 64px', textAlign:'center' }}>
        <div className="fade-up d1" style={{ marginBottom:24 }}>
          <span className="badge">
            <span className="badge-dot" />
            NotebookLM · Supabase · Google Classroom
          </span>
        </div>

        <h1 className="fade-up d2" style={{ fontFamily:'Playfair Display, serif', fontSize:'clamp(44px,7vw,80px)', fontWeight:900, lineHeight:0.95, letterSpacing:'-0.02em', marginBottom:24 }}>
          From classroom slides
          <br />
          <em style={{ color:'#E85D26' }}>to AI video explanations.</em>
        </h1>

        <p className="fade-up d3" style={{ fontSize:18, color:'#8C8070', lineHeight:1.7, maxWidth:520, margin:'0 auto 12px', fontWeight:300 }}>
          Connect Google Classroom once. Every new slide deck and attachment automatically
          becomes a NotebookLM video — organised class by class.
        </p>
        <p className="fade-up d3" style={{ fontSize:14, color:'#B0A898', fontStyle:'italic', marginBottom:40 }}>
          "Understand lectures in minutes, not slides."
        </p>

        {error && (
          <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:10, padding:'10px 18px', fontSize:13, color:'#DC2626', marginBottom:20, maxWidth:400, margin:'0 auto 20px' }}>
            {error}
          </div>
        )}

        <div className="fade-up d4" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
          <button className="google-btn" onClick={signInWithGoogle} disabled={loading}>
            {loading ? <Loader2 size={20} style={{ animation:'spin 1s linear infinite' }} /> : (
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {loading ? 'Connecting…' : 'Continue with Google'}
            {!loading && <ArrowRight size={16} />}
          </button>
          <span style={{ fontSize:12, color:'#B0A898' }}>Read-only Classroom access · We never modify your data</span>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section style={{ borderTop:'1px solid #D4CCBE', borderBottom:'1px solid #D4CCBE', background:'#EDE8DF' }}>
        <div style={{ maxWidth:760, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(3,1fr)' }}>
          {[
            { num:'< 1 min', label:'Per video generated' },
            { num:'100%',    label:'Automated pipeline' },
            { num:'∞',       label:'Courses supported' },
          ].map(({ num, label }, i) => (
            <div key={label} style={{ padding:'28px 24px', textAlign:'center', borderRight: i < 2 ? '1px solid #D4CCBE' : 'none' }}>
              <div style={{ fontFamily:'Playfair Display, serif', fontSize:36, fontWeight:900, letterSpacing:'-0.02em', marginBottom:4 }}>{num}</div>
              <div style={{ fontSize:13, color:'#8C8070', fontWeight:400 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ maxWidth:760, margin:'0 auto', padding:'72px 40px' }}>
        <p style={{ fontSize:11, fontWeight:600, letterSpacing:'0.14em', textTransform:'uppercase', color:'#8C8070', marginBottom:8 }}>How it works</p>
        <h2 style={{ fontFamily:'Playfair Display, serif', fontSize:'clamp(28px,4vw,40px)', fontWeight:900, letterSpacing:'-0.02em', marginBottom:40, lineHeight:1.1 }}>
          Set it up once.<br />
          <em style={{ color:'#8C8070', fontWeight:700 }}>Let it run forever.</em>
        </h2>
        {[
          { n:'01', title:'Connect Google Classroom', desc:'Sign in with Google and grant read-only access to your courses. Takes 30 seconds.' },
          { n:'02', title:'We watch for new posts',   desc:'Every announcement, assignment, and material upload is detected the moment it appears.' },
          { n:'03', title:'Notebooks created automatically', desc:'A NotebookLM notebook is created for each post with all attachments uploaded as AI sources.' },
          { n:'04', title:'AI video generated & saved', desc:'A video explanation is generated and stored in your class-wise library. Ready to watch instantly.' },
        ].map(({ n, title, desc }) => (
          <div key={n} className="step-row">
            <div className="step-num">{n}</div>
            <div>
              <p style={{ fontSize:16, fontWeight:600, marginBottom:5 }}>{title}</p>
              <p style={{ fontSize:14, color:'#8C8070', lineHeight:1.65, fontWeight:300 }}>{desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ── Features 2×2 grid ── */}
      <section style={{ background:'#EDE8DF', borderTop:'1px solid #D4CCBE', borderBottom:'1px solid #D4CCBE' }}>
        <div style={{ maxWidth:760, margin:'0 auto', padding:'72px 40px' }}>
          <p style={{ fontSize:11, fontWeight:600, letterSpacing:'0.14em', textTransform:'uppercase', color:'#8C8070', marginBottom:8 }}>Features</p>
          <h2 style={{ fontFamily:'Playfair Display, serif', fontSize:'clamp(26px,3.5vw,36px)', fontWeight:900, letterSpacing:'-0.02em', marginBottom:40 }}>
            Everything you need
          </h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16 }}>
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="feature-card">
                <div className="icon-box">
                  <Icon size={20} color="#F5F0E8" />
                </div>
                <h3 style={{ fontSize:16, fontWeight:600, marginBottom:8 }}>{title}</h3>
                <p style={{ fontSize:14, color:'#8C8070', lineHeight:1.65, fontWeight:300 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ maxWidth:760, margin:'0 auto', padding:'72px 40px' }}>
        <div style={{ background:'#0D0D0D', borderRadius:24, padding:'56px 48px', textAlign:'center' }}>
          <h2 style={{ fontFamily:'Playfair Display, serif', fontSize:'clamp(26px,4vw,38px)', fontWeight:900, color:'#F5F0E8', letterSpacing:'-0.02em', marginBottom:14, lineHeight:1.1 }}>
            Ready to stop<br /><em style={{ color:'#E85D26' }}>studying slides?</em>
          </h2>
          <p style={{ color:'rgba(245,240,232,0.5)', fontSize:15, marginBottom:36, fontWeight:300 }}>
            Connect your Classroom in 30 seconds. First video in under a minute.
          </p>
          <button className="google-btn" onClick={signInWithGoogle} disabled={loading} style={{ background:'#F5F0E8', color:'#0D0D0D' }}>
            {loading ? <Loader2 size={20} /> : (
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {loading ? 'Connecting…' : 'Get started free'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop:'1px solid #D4CCBE', padding:'20px 48px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:22, height:22, background:'#0D0D0D', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Play size={10} fill="#F5F0E8" color="#F5F0E8" />
          </div>
          <span style={{ fontSize:13, color:'#8C8070' }}>Slide2Learn — Convert boring PPTs into AI video explanations.</span>
        </div>
        <span style={{ fontSize:12, color:'#B0A898' }}>Read-only · Open source</span>
      </footer>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </main>
  )
}
