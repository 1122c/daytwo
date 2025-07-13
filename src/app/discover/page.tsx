"use client";
import { useEffect, useState, useMemo } from 'react';
import { db } from '@/services/firebase';
import { collection, getDocs, QueryDocumentSnapshot, DocumentData, query, where, deleteDoc, doc } from 'firebase/firestore';
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
  allowStrangerChats?: boolean;
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
    allowStrangerChats: data.allowStrangerChats ?? false,
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
  const [connectLoading, setConnectLoading] = useState<Record<string, boolean>>({});
  const [connectSuccess, setConnectSuccess] = useState<Record<string, boolean>>({});
  const [connectError, setConnectError] = useState<Record<string, string>>({});
  const [pendingRequests, setPendingRequests] = useState<Record<string, string>>({});
  const [connected, setConnected] = useState<Record<string, boolean>>({});
  const [compatThreshold, setCompatThreshold] = useState(70);

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

  useEffect(() => {
    async function fetchPendingRequests() {
      if (!user) {
        setPendingRequests({});
        return;
      }
      const q = query(collection(db, 'matchRequests'), where('fromUserId', '==', user.uid), where('status', '==', 'pending'));
      const snap = await getDocs(q);
      const pending: Record<string, string> = {};
      snap.forEach(docSnap => {
        const data = docSnap.data();
        if (data.toUserId) {
          pending[data.toUserId] = docSnap.id;
        }
      });
      setPendingRequests(pending);
    }
    fetchPendingRequests();
  }, [user, connectSuccess]);

  const shownProfiles = useMemo(() => {
    let result = profiles.filter(p => !currentUserProfile || p.id !== currentUserProfile.id);
    if (filter === 'compatible') {
      result = result.filter(p => compatScores[p.id] >= compatThreshold);
    } else if (filter === 'best') {
      result = [...result].sort((a, b) => (compatScores[b.id] || 0) - (compatScores[a.id] || 0));
    }
    return result;
  }, [profiles, currentUserProfile, filter, compatScores, compatThreshold]);

  // Fetch connected status for all shown profiles
  useEffect(() => {
    async function fetchConnections() {
      if (!user || shownProfiles.length === 0) {
        setConnected({});
        return;
      }
      const connections: Record<string, boolean> = {};
      await Promise.all(shownProfiles.map(async (profile) => {
        if (profile.id === user.uid) return;
        // Query for accepted connection in either direction
        const q1 = query(
          collection(db, 'matchRequests'),
          where('fromUserId', '==', user.uid),
          where('toUserId', '==', profile.id),
          where('status', '==', 'accepted')
        );
        const q2 = query(
          collection(db, 'matchRequests'),
          where('fromUserId', '==', profile.id),
          where('toUserId', '==', user.uid),
          where('status', '==', 'accepted')
        );
        const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
        connections[profile.id] = !snap1.empty || !snap2.empty;
      }));
      setConnected(connections);
    }
    fetchConnections();
  }, [user, shownProfiles]);

  async function handleConnect(toUserId: string) {
    if (!user) return;
    setConnectLoading((prev) => ({ ...prev, [toUserId]: true }));
    setConnectError((prev) => ({ ...prev, [toUserId]: '' }));
    setConnectSuccess((prev) => ({ ...prev, [toUserId]: false }));
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/requestMatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ toUserId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send connection request');
      }
      setConnectSuccess((prev) => ({ ...prev, [toUserId]: true }));
    } catch (e: unknown) {
      setConnectError((prev) => ({ ...prev, [toUserId]: e instanceof Error ? e.message : 'Failed to send connection request' }));
    } finally {
      setConnectLoading((prev) => ({ ...prev, [toUserId]: false }));
    }
  }

  async function handleCancelRequest(toUserId: string) {
    if (!user || !pendingRequests[toUserId]) return;
    try {
      await deleteDoc(doc(db, 'matchRequests', pendingRequests[toUserId]));
      setPendingRequests((prev) => {
        const copy = { ...prev };
        delete copy[toUserId];
        return copy;
      });
      setConnectSuccess((prev) => ({ ...prev, [toUserId]: false }));
    } catch {
      setConnectError((prev) => ({ ...prev, [toUserId]: 'Failed to cancel request' }));
    }
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
        {filter === 'compatible' && (
          <div className="flex items-center gap-2 ml-4">
            <label htmlFor="compat-threshold" className="text-sm text-gray-700">Min %:</label>
            <input
              id="compat-threshold"
              type="number"
              min={0}
              max={100}
              step={1}
              value={compatThreshold}
              onChange={e => setCompatThreshold(Math.max(0, Math.min(100, Number(e.target.value))))}
              className="w-16 border rounded px-2 py-1 text-center"
            />
          </div>
        )}
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
                {filter === 'best' && user && (
                  <ul className="mb-2 list-disc list-inside text-sm text-gray-700">
                    {(() => {
                      const current = currentUserProfile;
                      if (!current) return null;
                      const sharedValues = profile.values.filter(v => current.values.includes(v));
                      const sharedGoals = profile.goals.filter(g => current.goals.includes(g));
                      const sharedPreferences = profile.preferences.filter(p => current.preferences.includes(p));
                      const bullets = [];
                      if (sharedValues.length > 0) bullets.push(`Shared values: ${sharedValues.join(', ')}`);
                      if (sharedGoals.length > 0) bullets.push(`Shared goals: ${sharedGoals.join(', ')}`);
                      if (sharedPreferences.length > 0) bullets.push(`Shared preferences: ${sharedPreferences.join(', ')}`);
                      if (bullets.length === 0) bullets.push('Potential for growth or complementary interests.');
                      return bullets.map((b, i) => <li key={i}>{b}</li>);
                    })()}
                  </ul>
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
                <div className="mt-4 flex gap-2">
                  {(() => {
                    const isConnected = connected[profile.id];
                    const canChat = profile.allowStrangerChats || isConnected;
                    return (
                      <button
                        className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 ${!canChat ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => canChat && router.push(`/chat?user=${profile.id}`)}
                        disabled={!canChat}
                        title={!canChat ? 'This user only accepts chats from connections.' : ''}
                      >
                        Start Chat
                      </button>
                    );
                  })()}
                  {pendingRequests[profile.id] ? (
                    <>
                      <span className="px-4 py-2 rounded bg-yellow-100 text-yellow-800 border border-yellow-400">Pending Connection Request</span>
                      <button
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-60"
                        onClick={() => handleCancelRequest(profile.id)}
                        disabled={connectLoading[profile.id]}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-60"
                      disabled={connectLoading[profile.id] || connectSuccess[profile.id]}
                      onClick={() => handleConnect(profile.id)}
                    >
                      {connectSuccess[profile.id] ? 'Request Sent!' : connectLoading[profile.id] ? 'Sending...' : 'Connect with this user'}
                    </button>
                  )}
                </div>
                {connectError[profile.id] && (
                  <div className="text-red-600 text-sm mt-2">{connectError[profile.id]}</div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
} 