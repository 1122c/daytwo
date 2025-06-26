"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { auth } from '@/services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';

// Placeholder user data (replace with real user data later)
const userProfile = {
  name: 'Your Name',
  avatar: 'https://ui-avatars.com/api/?name=Your+Name',
  values: ['empathy', 'growth', 'curiosity'],
  goals: ['find a mentor', 'expand network'],
  preferences: ['small group', 'in-person'],
  publicProfiles: {
    linkedin: 'https://linkedin.com/in/yourname',
    twitter: 'https://twitter.com/yourname',
    instagram: '',
    tiktok: '',
    onlyfans: '',
  },
};

export default function DashboardPage() {
  const [authUser, setAuthUser] = useState<User | null | undefined>(undefined);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      if (!user) {
        router.replace('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (authUser === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 text-lg">Loading...</div>
      </div>
    );
  }

  if (!authUser) {
    // Redirect handled in useEffect
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <nav className="w-full max-w-xl mx-auto mb-8 flex justify-between">
        <Link href="/">
          <span className="text-blue-600 hover:underline font-medium">Onboarding</span>
        </Link>
        <Link href="/discover">
          <span className="text-blue-600 hover:underline font-medium">Discover Profiles</span>
        </Link>
      </nav>
      <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-8 flex flex-col items-center">
        <img
          src={userProfile.avatar}
          alt="User Avatar"
          className="w-24 h-24 rounded-full mb-4 border"
        />
        <h1 className="text-2xl font-bold mb-2">{userProfile.name}</h1>
        <div className="w-full mt-4">
          <div className="mb-2">
            <span className="font-medium">Values:</span> {userProfile.values.join(', ')}
          </div>
          <div className="mb-2">
            <span className="font-medium">Goals:</span> {userProfile.goals.join(', ')}
          </div>
          <div className="mb-2">
            <span className="font-medium">Preferences:</span> {userProfile.preferences.join(', ')}
          </div>
          <div className="mb-2">
            <span className="font-medium">Public Profiles:</span>
            <ul className="list-disc list-inside text-blue-600">
              {Object.entries(userProfile.publicProfiles).map(([platform, url]) =>
                url ? (
                  <li key={platform}>
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </a>
                  </li>
                ) : null
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 