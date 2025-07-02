"use client";
import { useEffect, useState } from 'react';
import { db } from '@/services/firebase';
import { collection, getDocs, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface Profile {
  id: string;
  name: string;
  values: string[];
  goals: string[];
  preferences: string[];
  publicProfiles: Record<string, string>;
  bio?: string;
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
    bio: data.bio || '',
  };
}

function toAdvancedUserProfile(profile: Profile) {
  return {
    id: profile.id,
    name: profile.name,
    values: {
      coreValues: Array.isArray(profile.values) ? profile.values : [],
      personalGoals: Array.isArray(profile.goals) ? profile.goals : [],
      preferredCommunication: [],
      availability: { timezone: '', preferredTimes: [] },
    },
    bio: profile.bio || '',
  };
}

export default function ProfileDiscoveryPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'best' | 'compatible'>('all');
  const [compatScores, setCompatScores] = useState<Record<string, number>>({});
  const { user } = useAuth();
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  const [compatLoading, setCompatLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchProfiles() {
      setLoading(true);
      setError('');
      try {
        const querySnapshot = await getDocs(collection(db, 'profiles'));
        const allProfiles = querySnapshot.docs.map(parseProfile);
        setProfiles(allProfiles);
        if (user) {
          const mine = allProfiles.find(p => p.id === user.uid) || null;
          setCurrentUserProfile(mine);
        }
      } catch {
        setError('Failed to load profiles.');
      } finally {
        setLoading(false);
      }
    }
    fetchProfiles();
  }, [user]);

  // Fetch compatibility scores from API when needed
  useEffect(() => {
    async function fetchCompatScores() {
      if (!currentUserProfile || filter === 'all') {
        setCompatScores({});
        return;
      }
      setCompatLoading(true);
      try {
        const res = await fetch('/api/compatibility', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentUser: toAdvancedUserProfile(currentUserProfile),
            profiles: profiles.filter(p => p.id !== currentUserProfile.id).map(toAdvancedUserProfile),
          }),
        });
        const data = await res.json();
        setCompatScores(data.scores || {});
      } catch {
        setCompatScores({});
      } finally {
        setCompatLoading(false);
      }
    }
    fetchCompatScores();
  }, [profiles, currentUserProfile, filter]);

  // Filter/sort profiles based on filter
  let shownProfiles = profiles.filter(p => !currentUserProfile || p.id !== currentUserProfile.id);
  if (filter === 'compatible') {
    shownProfiles = shownProfiles.filter(p => compatScores[p.id] >= 70);
  } else if (filter === 'best') {
    shownProfiles = [...shownProfiles].sort((a, b) => (compatScores[b.id] || 0) - (compatScores[a.id] || 0));
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <nav className="w-full max-w-2xl mx-auto mb-8 flex justify-end">
        {/* Onboarding link removed */}
      </nav>
      <h1 className="text-3xl font-bold text-center mb-8">Discover Profiles</h1>
      <div className="max-w-2xl mx-auto mb-6 flex gap-4 items-center">
        <span className="font-semibold">Filter:</span>
        <button
          className={`px-3 py-1 rounded ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white border border-blue-600 text-blue-700'}`}
          onClick={() => setFilter('all')}
        >
          All Profiles
        </button>
        <button
          className={`px-3 py-1 rounded ${filter === 'best' ? 'bg-green-600 text-white' : 'bg-white border border-green-600 text-green-700'}`}
          onClick={() => setFilter('best')}
          disabled={!user}
        >
          Best Matches
        </button>
        <button
          className={`px-3 py-1 rounded ${filter === 'compatible' ? 'bg-purple-600 text-white' : 'bg-white border border-purple-600 text-purple-700'}`}
          onClick={() => setFilter('compatible')}
          disabled={!user}
        >
          Compatible Only
        </button>
        {!user && <span className="text-xs text-gray-500">(Log in to see compatibility)</span>}
      </div>
      {(compatLoading && filter !== 'all') ? (
        <div className="text-center text-gray-500">Calculating compatibility...</div>
      ) : loading ? (
        <div className="text-center text-gray-500">Loading profiles...</div>
      ) : error ? (
        <div className="text-center text-red-600">{error}</div>
      ) : (
        <div className="max-w-2xl mx-auto grid gap-6">
          {shownProfiles.length === 0 ? (
            <div className="text-center text-gray-500">No profiles found.</div>
          ) : (
            shownProfiles.map((profile) => (
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
                {filter !== 'all' && user && (
                  <div className="mb-1 text-blue-700 font-semibold">Compatibility: {compatScores[profile.id] ?? '--'}%</div>
                )}
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