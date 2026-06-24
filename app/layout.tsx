import './globals.css'
import Navbar from './Navbar'

export const metadata = {
  title: 'LC Vet',
  description: 'Sistema de gestión veterinaria',
  manifest: '/manifest.json',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {  return (
    <html lang="es">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  )
}