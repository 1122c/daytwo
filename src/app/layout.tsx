import { ReactNode } from 'react'
import './globals.css'       // <— import Tailwind here (server component!)
import NavWrapper from '../components/NavWrapper'

export const metadata = {
  title: 'ConnectMind',
  description: 'Make intentional, human-centered connections',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  // Render nav on all pages except home
  return (
    <html lang="en">
      <body>
        <NavWrapper>
          <div className="bg-green-200 min-h-screen">{ children }</div>
        </NavWrapper>
      </body>
    </html>
  )
}


