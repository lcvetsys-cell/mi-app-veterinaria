import './globals.css'
import Navbar from './Navbar'

export const metadata = {
  title: 'App Veterinaria',
  description: 'Sistema de gestión veterinaria',
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