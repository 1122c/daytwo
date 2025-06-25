// src/app/page.tsx
'use client'
import OnboardingForm from './OnboardingForm';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <nav className="w-full max-w-md mx-auto mt-4 mb-6 flex justify-end">
        <Link href="/discover">
          <span className="text-blue-600 hover:underline font-medium">Discover Profiles</span>
        </Link>
      </nav>
      <OnboardingForm />
    </div>
  );
}
