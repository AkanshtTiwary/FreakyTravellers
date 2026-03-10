'use client';

import './globals.css'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { GoogleOAuthProvider } from '@react-oauth/google'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
          <div className="min-h-screen bg-black">
            {children}
          </div>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#16181C',
                color: '#A8ADB2',
                border: '1px solid #2F3336',
                borderRadius: '12px',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#00BA7C',
                  secondary: '#16181C',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#F91880',
                  secondary: '#16181C',
                },
              },
            }}
          />
        </GoogleOAuthProvider>
      </body>
    </html>
  )
}
