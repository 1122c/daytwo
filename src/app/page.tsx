// src/app/page.tsx
'use client'
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-6">day one</h1>
        <p className="mb-8 text-gray-600 text-center">Welcome to day one. Sign up or log in to start connecting.</p>
        <Link href="/login" className="w-full mb-3">
          <button className="w-full bg-blue-500 text-white py-2 rounded mb-2">Login</button>
        </Link>
        <Link href="/signup" className="w-full mb-3">
          <button className="w-full bg-green-500 text-white py-2 rounded mb-2">Sign Up</button>
        </Link>
        <Link href="/password-recovery" className="w-full">
          <button className="w-full text-blue-600 underline py-2">Forgot password?</button>
        </Link>
      </div>
    </div>
  );
}
