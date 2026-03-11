'use client'
import { useState } from 'react'
import { BookOpen, Video, Zap, Shield, ArrowRight, Loader2 } from 'lucide-react'

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
    } catch (e: any) {
      setError(e.message)
      setLoading(false)
    }
  }

  const features = [
    { icon: Zap,     title: 'Auto-Detect',       desc: 'Watches your Classroom for new announcements, assignments, and slide uploads the moment they appear.' },
    { icon: BookOpen,title: 'NotebookLM Sync',    desc: 'Creates a dedicated AI notebook for each post and uploads every attachment as a source automatically.' },
    { icon: Video,   title: 'AI Video Generation',desc: 'Converts slides and PDFs into a clear, engaging video explanation — no effort required from you.' },
    { icon: Shield,  title: 'Class-wise Storage', desc: 'Every video neatly stored by course in Supabase. Stream or download any explanation in one click.' },
  ]

  return (
    <main className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center">
            <Video className="w-4 h-4 text-white" />
          </div>
          <span className="font-display text-xl font-black tracking-tight">
            Slide<span className="text-accent italic">2Learn</span>
          </span>
        </div>
        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="text-sm font-medium text-muted hover:text-ink transition-colors"
        >
          Sign in →
        </button>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-surface border border-border rounded-full px-4 py-1.5 text-xs font-medium text-muted mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot inline-block" />
          Powered by NotebookLM · Supabase · Google Classroom
        </div>

        <h1 className="font-display text-5xl md:text-7xl font-black leading-[0.9] tracking-tight max-w-3xl mb-4">
          From classroom slides
          <br />
          <span className="text-accent italic">to AI video explanations.</span>
        </h1>

        <p className="text-muted text-lg max-w-lg leading-relaxed mb-3">
          Connect Google Classroom once. Every new slide deck and attachment
          automatically becomes a NotebookLM video — organised class by class.
        </p>

        <p className="text-sm font-medium text-ink/50 mb-10 italic">
          "Understand lectures in minutes, not slides."
        </p>

        {error && (
          <div className="mb-6 px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm max-w-sm">
            {error}
          </div>
        )}

        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="group flex items-center gap-3 bg-ink text-paper px-8 py-4 rounded-2xl text-base font-semibold hover:bg-accent transition-all duration-200 disabled:opacity-60 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {loading ? 'Connecting…' : 'Connect with Google'}
          {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
        </button>
        <p className="text-xs text-muted mt-3">Read-only Classroom access. We never modify your data.</p>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-surface px-6 py-14">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted mb-8">How it works</p>
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-paper border border-border rounded-2xl p-6 hover:border-accent/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-ink flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-paper" />
              </div>
              <h3 className="font-display font-bold text-lg mb-2">{title}</h3>
              <p className="text-muted text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-8 py-5 flex items-center justify-between text-xs text-muted">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-accent rounded flex items-center justify-center">
            <Video className="w-2.5 h-2.5 text-white" />
          </div>
          <span>Slide2Learn — Convert boring PPTs into AI video explanations.</span>
        </div>
        <span>Read-only · Open source</span>
      </footer>
    </main>
  )
}
