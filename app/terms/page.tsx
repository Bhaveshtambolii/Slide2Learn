export const metadata = { title: 'Terms of Service – Slide2Learn' }

export default function TermsOfService() {
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
        <h1 style={{ fontFamily:'Playfair Display,serif', fontSize:'clamp(28px,5vw,42px)', fontWeight:900, letterSpacing:'-0.02em', lineHeight:1.1, marginBottom:32 }}>Terms of Service</h1>

        {[
          {
            title: '1. Acceptance of Terms',
            body: `By accessing or using Slide2Learn ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service. These terms apply to all users of the Service.`,
          },
          {
            title: '2. Description of Service',
            body: `Slide2Learn is a web application that connects to your Google Classroom account and automates the creation of AI-generated video explanations from your course materials. The Service reads your Classroom posts and attachments, processes them through AI tools, and stores the generated videos for your access.`,
          },
          {
            title: '3. Eligibility',
            body: `You must be at least 13 years of age to use this Service. By using the Service, you represent and warrant that you meet this requirement. If you are using this Service on behalf of an educational institution, you represent that you have the authority to bind that institution to these terms.`,
          },
          {
            title: '4. Google Account & Permissions',
            body: `The Service requires you to sign in with a Google account and grant specific permissions to access Google Classroom and Google Drive data. You are responsible for:\n\n• Maintaining the security of your Google account\n• Ensuring you have the right to share any Classroom content with this Service\n• Revoking access at any time through your Google Account settings if you wish to stop using the Service`,
          },
          {
            title: '5. Acceptable Use',
            body: `You agree to use the Service only for lawful purposes. You must not:\n\n• Use the Service to process content you do not have the right to access\n• Attempt to reverse engineer, scrape, or extract data from the Service in bulk\n• Use the Service to harass, harm, or violate the privacy of others\n• Attempt to circumvent any security measures of the Service\n• Use the Service for any commercial purpose without our prior written consent`,
          },
          {
            title: '6. Intellectual Property',
            body: `The Slide2Learn application, its design, code, and branding are owned by us and protected by applicable intellectual property laws. Your Classroom content remains your property (or that of your institution). The AI-generated videos produced by the Service are provided to you for personal educational use.`,
          },
          {
            title: '7. Third-Party Services',
            body: `The Service integrates with third-party platforms including Google Classroom, Google Drive, NotebookLM, Supabase, and Vercel. Your use of these platforms is governed by their respective terms of service. We are not responsible for any changes, outages, or policy updates by these third-party providers that may affect the Service.`,
          },
          {
            title: '8. Disclaimers',
            body: `The Service is provided "as is" without warranties of any kind, express or implied. We do not warrant that:\n\n• The Service will be uninterrupted or error-free\n• AI-generated videos will be accurate or complete\n• The Service will meet your specific educational requirements\n\nAI-generated content should be reviewed before use in any academic or professional context.`,
          },
          {
            title: '9. Limitation of Liability',
            body: `To the fullest extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the Service, including but not limited to loss of data, loss of revenue, or interruption of business.`,
          },
          {
            title: '10. Privacy',
            body: `Your use of the Service is also governed by our Privacy Policy, available at https://slide2-learn-chi.vercel.app/privacy. By using the Service, you consent to the collection and use of your information as described in the Privacy Policy.`,
          },
          {
            title: '11. Termination',
            body: `We reserve the right to suspend or terminate your access to the Service at any time, with or without notice, for conduct that we determine violates these Terms or is harmful to other users, us, or third parties. You may stop using the Service at any time by revoking Google OAuth access from your Google Account settings.`,
          },
          {
            title: '12. Changes to Terms',
            body: `We reserve the right to modify these Terms at any time. We will indicate the date of the most recent update at the top of this page. Your continued use of the Service after changes are posted constitutes your acceptance of the revised Terms.`,
          },
          {
            title: '13. Governing Law',
            body: `These Terms shall be governed by and construed in accordance with applicable laws. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the competent courts.`,
          },
          {
            title: '14. Contact Us',
            body: `If you have any questions about these Terms of Service, please contact us at:\n\nEmail: legal@slide2learn.com\nWebsite: https://slide2-learn-chi.vercel.app`,
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
