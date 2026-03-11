import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Slide2Learn — Convert boring PPTs into AI video explanations',
  description: 'Automatically sync Google Classroom slides and attachments to NotebookLM and generate AI video explanations, organised class by class.',
  keywords: ['Google Classroom', 'NotebookLM', 'AI video', 'lecture summary', 'study tool', 'slide to video'],
  openGraph: {
    title: 'Slide2Learn',
    description: 'From classroom slides to AI video explanations. Automatically.',
    siteName: 'Slide2Learn',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Slide2Learn',
    description: 'Convert boring PPTs into AI video explanations.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body bg-paper text-ink antialiased">
        {children}
      </body>
    </html>
  )
}
