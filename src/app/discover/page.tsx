"use client";
import { useEffect, useState } from 'react';
import { db } from '@/services/firebase';
import { collection, getDocs, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Profile {
  id: string;
  name: string;
  values: string[];
  goals: string[];
  preferences: string[];
  publicProfiles: Record<string, string>;
}

function parseProfile(doc: QueryDocumentSnapshot<DocumentData>): Profile {
  const data = doc.data();
  return {
    id: doc.id,
    values: data.values || [],
    goals: data.goals || [],
    preferences: data.preferences || [],
    publicProfiles: data.publicProfiles || {},
    name: data.name || 'Anonymous',
  };
}

export default function ProfileDiscoveryPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    async function fetchProfiles() {
      setLoading(true);
      setError('');
      try {
        const querySnapshot = await getDocs(collection(db, 'profiles'));
        setProfiles(querySnapshot.docs.map(parseProfile));
      } catch {
        setError('Failed to load profiles.');
      } finally {
        setLoading(false);
      }
    }
    fetchProfiles();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <nav className="w-full max-w-2xl mx-auto mb-8 flex justify-end">
        {/* Onboarding link removed */}
      </nav>
      <h1 className="text-3xl font-bold text-center mb-8">Discover Profiles</h1>
      {loading ? (
        <div className="text-center text-gray-500">Loading profiles...</div>
      ) : error ? (
        <div className="text-center text-red-600">{error}</div>
      ) : (
        <div className="max-w-2xl mx-auto grid gap-6">
          {profiles.length === 0 ? (
            <div className="text-center text-gray-500">No profiles found.</div>
          ) : (
            profiles.map((profile) => (
              <div key={profile.id} className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-2">{profile.name}</h2>
                <div className="mb-1 text-gray-700">
                  <span className="font-medium">Values:</span> {profile.values.join(', ')}
                </div>
                <div className="mb-1 text-gray-700">
                  <span className="font-medium">Goals:</span> {profile.goals.join(', ')}
                </div>
                <div className="mb-1 text-gray-700">
                  <span className="font-medium">Preferences:</span> {profile.preferences.join(', ')}
                </div>
                {profile.publicProfiles && (
                  <div className="mt-2">
                    <span className="font-medium">Public Profiles:</span>
                    <ul className="list-disc list-inside text-blue-600">
                      {Object.entries(profile.publicProfiles).map(([platform, url]) =>
                        url && typeof url === 'string' ? (
                          <li key={platform}>
                            <a href={url} target="_blank" rel="noopener noreferrer">
                              {platform.charAt(0).toUpperCase() + platform.slice(1)}
                            </a>
                          </li>
                        ) : null
                      )}
                    </ul>
                  </div>
                )}
                <div className="mt-4">
                  <button
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    onClick={() => router.push(`/chat?user=${profile.id}`)}
                  >
                    Start Chat
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
} 