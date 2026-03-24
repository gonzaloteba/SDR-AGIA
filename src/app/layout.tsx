import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Coach Dashboard',
  description: 'Dashboard interactivo para coaches - Agia Consulting',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
