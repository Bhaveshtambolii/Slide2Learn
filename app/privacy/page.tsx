export const metadata = { title: 'Privacy Policy – Slide2Learn' }

export default function PrivacyPolicy() {
  const lastUpdated = 'March 2025'
  return (
    <main style={{ fontFamily:"'DM Sans',sans-serif", background:'#F5F0E8', minHeight:'100vh', color:'#0D0D0D' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Playfair+Display:wght@700;900&display=swap');*{box-sizing:border-box;margin:0;padding:0;}a{color:#E85D26;}`}</style>

      {/* Nav */}
      <nav style={{ borderBottom:'1px solid #D4CCBE', padding:'14px 32px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <a href="/" style={{ fontFamily:'Playfair Display,serif', fontSize:18, fontWeight:900, textDecoration:'none', color:'#0D0D0D' }}>
          Slide<em style={{ color:'#E85D26' }}>2Learn</em>
        </a>
        <a href="/" style={{ fontSize:13, color:'#8C8070', textDecoration:'none' }}>← Back to Home</a>
      </nav>

      <div style={{ maxWidth:760, margin:'0 auto', padding:'60px 24px 80px' }}>
        <p style={{ fontSize:13, color:'#8C8070', marginBottom:8 }}>Last updated: {lastUpdated}</p>
        <h1 style={{ fontFamily:'Playfair Display,serif', fontSize:'clamp(28px,5vw,42px)', fontWeight:900, letterSpacing:'-0.02em', lineHeight:1.1, marginBottom:32 }}>Privacy Policy</h1>

        {[
          {
            title: '1. Introduction',
            body: `Slide2Learn ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our service, which converts Google Classroom content into AI-generated video explanations.`,
          },
          {
            title: '2. Information We Collect',
            body: `We collect the following information when you sign in with Google:\n\n• Your Google account email address and display name\n• Google Classroom course names, sections, and enrollment codes\n• Course announcements, assignments, and attached materials\n• Google Drive file metadata (names and links) attached to Classroom posts\n\nWe do NOT collect passwords, payment information, or any data beyond what is listed above.`,
          },
          {
            title: '3. How We Use Your Information',
            body: `We use your information solely to provide the Slide2Learn service:\n\n• To display your Classroom courses and posts in the dashboard\n• To sync new posts and attachments for AI video generation\n• To store generated AI video files linked to your account\n• To associate your renamed/archived course preferences with your account\n\nWe do not sell, trade, or share your personal information with third parties for marketing purposes.`,
          },
          {
            title: '4. Google API Data Usage',
            body: `Slide2Learn uses Google OAuth 2.0 to access the following Google APIs on your behalf:\n\n• Google Classroom API — to read your courses, posts, assignments, and rosters\n• Google Drive API — to read files attached to Classroom posts for AI processing\n\nOur use and transfer of information received from Google APIs complies with the Google API Services User Data Policy, including the Limited Use requirements. We only access data necessary to provide the core functionality of the service.`,
          },
          {
            title: '5. Data Storage',
            body: `Your data is stored securely using Supabase, a cloud database provider. We store:\n\n• Your user ID and email (for authentication)\n• Course metadata and synced post records (for dashboard display)\n• Generated AI video files (in Supabase Storage)\n• Course customisation preferences (rename, archive status)\n\nAccess tokens from Google are stored only in your browser session and are never persisted to our database.`,
          },
          {
            title: '6. Data Retention',
            body: `Your data is retained for as long as your account is active. You may request deletion of your data at any time by contacting us at the email address below. Upon deletion, all your course data, synced posts, and generated videos will be permanently removed from our systems.`,
          },
          {
            title: '7. Third-Party Services',
            body: `Slide2Learn uses the following third-party services:\n\n• Supabase — database and authentication (supabase.com)\n• Google Classroom & Drive APIs — data source (Google LLC)\n• NotebookLM — AI video generation (Google LLC)\n• Vercel — hosting and deployment (vercel.com)\n\nEach of these services has their own privacy policies which govern their data handling.`,
          },
          {
            title: '8. Security',
            body: `We implement appropriate technical and organisational measures to protect your personal information. All data is transmitted over HTTPS. Access to your Classroom data requires your explicit Google OAuth consent, which you may revoke at any time from your Google Account settings.`,
          },
          {
            title: '9. Your Rights',
            body: `You have the right to:\n\n• Access the personal data we hold about you\n• Request correction of inaccurate data\n• Request deletion of your data\n• Withdraw consent by revoking Google OAuth access\n• Lodge a complaint with your local data protection authority\n\nTo exercise any of these rights, please contact us at the email address below.`,
          },
          {
            title: '10. Changes to This Policy',
            body: `We may update this Privacy Policy from time to time. We will notify you of any significant changes by updating the "Last updated" date at the top of this page. Continued use of the service after changes constitutes acceptance of the updated policy.`,
          },
          {
            title: '11. Contact Us',
            body: `If you have any questions about this Privacy Policy, please contact us at:\n\nEmail: bhaveshtamboli10@gmail.com\nWebsite: https://slide2-learn-chi.vercel.app`,
          },
        ].map(({ title, body }) => (
          <div key={title} style={{ marginBottom:36 }}>
            <h2 style={{ fontFamily:'Playfair Display,serif', fontSize:20, fontWeight:700, marginBottom:10, color:'#0D0D0D' }}>{title}</h2>
            <p style={{ fontSize:14, lineHeight:1.8, color:'#3B3B3B', whiteSpace:'pre-line' }}>{body}</p>
          </div>
        ))}
      </div>

      <footer style={{ borderTop:'1px solid #D4CCBE', padding:'20px 32px', display:'flex', gap:20, justifyContent:'center' }}>
        <a href="/privacy" style={{ fontSize:12, color:'#8C8070', textDecoration:'none' }}>Privacy Policy</a>
        <a href="/terms"   style={{ fontSize:12, color:'#8C8070', textDecoration:'none' }}>Terms of Service</a>
        <a href="/"        style={{ fontSize:12, color:'#8C8070', textDecoration:'none' }}>Home</a>
      </footer>
    </main>
  )
}
