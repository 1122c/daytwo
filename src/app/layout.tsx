import { ReactNode } from 'react'
import './globals.css'       // <— import Tailwind here (server component!)
import Layout from '../components/Layout'  // this is a client component

export const metadata = {
  title: 'ConnectMind',
  description: 'Make intentional, human-centered connections',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="bg-green-200 min-h-screen">{ children }</div>
      </body>
    </html>
  )
}


