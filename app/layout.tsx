import type { Metadata } from 'next'
import './globals.css'
import ThemeToggle from '@/components/ThemeToggle'

export const metadata: Metadata = {
  title: 'Farely — Find Flights You\'ll Love',
  description: 'AI-powered flight search. Tell us where you want to feel, and we\'ll find the flights.',
  openGraph: {
    title: 'Farely — Find Flights You\'ll Love',
    description: 'AI-powered flight search with real-time deals',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme on load */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var stored = localStorage.getItem('theme');
            var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (stored === 'dark' || (!stored && prefersDark)) {
              document.documentElement.classList.add('dark');
            }
          })();
        ` }} />
      </head>
      <body>
        {children}
        <ThemeToggle />
      </body>
    </html>
  )
}
