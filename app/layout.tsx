import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Heyy - Rural Services Marketplace',
  description: 'Find and book trusted local service providers',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
