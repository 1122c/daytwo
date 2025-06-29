"use client";
import { useEffect, useState } from "react";
import { auth } from '@/services/firebase';
import { useRouter } from 'next/navigation';
import { User } from 'firebase/auth';

interface Profile {
  id: string;
  name?: string;
  values: string[];
  goals: string[];
  preferences: string[];
  publicProfiles: Record<string, string>;
  communicationStyle?: string[];
  interests?: string[];
  connectionType?: string[];
  growthAreas?: string[];
  availability?: string[];
  location?: string;
  timezone?: string;
  identityTags?: string[];
}

interface Match {
  group: Profile[];
  sharedValues: number;
  sharedGoals: number;
  sharedPreferences: number;
  sharedInterests: number;
  sharedCommunicationStyle: number;
  sharedConnectionType: number;
  sharedGrowthAreas: number;
  sharedAvailability: number;
  sharedIdentityTags: number;
  complementaryConnectionType: number;
  explanation?: string | null;
}

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // AI suggestions state
  const [starters, setStarters] = useState<Record<number, string[]>>({});
  const [startersLoading, setStartersLoading] = useState<Record<number, boolean>>({});
  const [startersError, setStartersError] = useState<Record<number, string>>({});
  const [iceBreakers, setIceBreakers] = useState<Record<number, string[]>>({});
  const [iceBreakersLoading, setIceBreakersLoading] = useState<Record<number, boolean>>({});
  const [iceBreakersError, setIceBreakersError] = useState<Record<number, string>>({});
  const [promptType, setPromptType] = useState<Record<number, 'icebreaker' | 'starter'>>({});

  const router = useRouter();

  // Add auth state listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setAuthUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Update fetchMatches to use authUser instead of auth.currentUser
  useEffect(() => {
    async function fetchMatches() {
      // Don't fetch until auth is loaded
      if (authLoading) return;
      
      setLoading(true);
      setError("");
      try {
        console.log('Fetching matches...'); // Debug log
        console.log('Auth user:', authUser); // Debug log
        
        // Check authUser instead of auth.currentUser
        if (!authUser) {
          setError("You must be logged in to view matches.");
          setLoading(false);
          return;
        }
        
        const idToken = await authUser.getIdToken();
        
        const res = await fetch("/api/match", {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${idToken}`,
          },
        });
        
        console.log('Match API response status:', res.status); // Debug log
        
        if (!res.ok) {
          const errorData = await res.json();
          console.log('Match API error:', errorData); // Debug log
          throw new Error(`HTTP ${res.status}: ${errorData.error || 'Unknown error'}`);
        }
        
        const data = await res.json();
        console.log('Match API data:', data); // Debug log
        console.log('Number of matches found:', data.matches?.length || 0); // Debug log
        setConnections(data.matches || []);
      } catch (err) {
        console.error('Error fetching matches:', err); // Debug log
        setError("Failed to load matches.");
      } finally {
        setLoading(false);
      }
    }
    fetchMatches();
  }, [authUser, authLoading]);

  // Helper to get the first two profiles in a match group
  function getPair(match: Match) {
    return match.group.length >= 2 ? [match.group[0], match.group[1]] : [match.group[0], match.group[0]];
  }

  async function handleFetchStarters(i: number, match: Match) {
    setStartersLoading((prev) => ({ ...prev, [i]: true }));
    setStartersError((prev) => ({ ...prev, [i]: "" }));
    const [userProfile, matchProfile] = getPair(match);
    try {
      const idToken = await authUser?.getIdToken();
      const res = await fetch("/api/conversation-starters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ userProfile, matchProfile }),
      });
      const data = await res.json();
      if (data.starters) {
        setStarters((prev) => ({ ...prev, [i]: data.starters }));
      } else {
        setStartersError((prev) => ({ ...prev, [i]: "No starters found." }));
      }
    } catch {
      setStartersError((prev) => ({ ...prev, [i]: "Failed to fetch conversation starters." }));
    } finally {
      setStartersLoading((prev) => ({ ...prev, [i]: false }));
    }
  }

  async function handleFetchIceBreakers(i: number, match: Match) {
    setIceBreakersLoading((prev) => ({ ...prev, [i]: true }));
    setIceBreakersError((prev) => ({ ...prev, [i]: "" }));
    const [userProfile, matchProfile] = getPair(match);
    try {
      const idToken = await authUser?.getIdToken();
      const res = await fetch("/api/ice-breakers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ userProfile, matchProfile }),
      });
      const data = await res.json();
      if (data.activities) {
        setIceBreakers((prev) => ({ ...prev, [i]: data.activities }));
      } else {
        setIceBreakersError((prev) => ({ ...prev, [i]: "No ice breakers found." }));
      }
    } catch {
      setIceBreakersError((prev) => ({ ...prev, [i]: "Failed to fetch ice breakers." }));
    } finally {
      setIceBreakersLoading((prev) => ({ ...prev, [i]: false }));
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-center">Your Connections</h1>
        </div>
        {loading ? (
          <div className="text-center text-gray-500">Loading connections...</div>
        ) : error ? (
          <div className="text-center text-red-600">{error}</div>
        ) : connections.length === 0 ? (
          <div className="text-center text-gray-500">No connections found.</div>
        ) : (
          <div className="grid gap-6">
            {connections.map((match, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="mb-2 font-semibold text-lg">Group:</div>
                <ul className="mb-2">
                  {match.group.map((user) => (
                    <li key={user.id} className="mb-1">
                      <span className="font-bold">{user.name || user.id}</span>
                      {user.values?.length > 0 && (
                        <span className="text-gray-500"> | Values: {user.values.join(", ")}</span>
                      )}
                      {user.goals?.length > 0 && (
                        <span className="text-gray-500"> | Goals: {user.goals.join(", ")}</span>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Shared Values:</span> {match.sharedValues} | 
                  <span className="font-medium">Shared Goals:</span> {match.sharedGoals} | 
                  <span className="font-medium">Shared Preferences:</span> {match.sharedPreferences} | 
                  <span className="font-medium">Shared Interests:</span> {match.sharedInterests} | 
                  <span className="font-medium">Shared Communication Style:</span> {match.sharedCommunicationStyle} | 
                  <span className="font-medium">Shared Connection Type:</span> {match.sharedConnectionType} | 
                  <span className="font-medium">Shared Growth Areas:</span> {match.sharedGrowthAreas} | 
                  <span className="font-medium">Shared Availability:</span> {match.sharedAvailability} | 
                  <span className="font-medium">Shared Identity Tags:</span> {match.sharedIdentityTags}
                  {match.complementaryConnectionType > 0 && (
                    <span className="ml-2 inline-block px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-semibold align-middle">Complementary Match (e.g. mentor/mentee)</span>
                  )}
                </div>
                {match.explanation && (
                  <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-400 text-blue-900 rounded">
                    <span className="font-semibold">Why you matched:</span> {match.explanation}
                  </div>
                )}
                {/* Prompt Type Toggle */}
                <div className="mt-6 mb-2 flex gap-2 items-center">
                  <button
                    className={`px-3 py-1 rounded-l-md border ${promptType[i] !== 'starter' ? 'bg-blue-600 text-white' : 'bg-white text-blue-700 border-blue-600'} transition-colors`}
                    onClick={() => setPromptType((prev) => ({ ...prev, [i]: 'icebreaker' }))}
                  >
                    🧊 Ice Breakers
                  </button>
                  <button
                    className={`px-3 py-1 rounded-r-md border-l-0 border ${promptType[i] === 'starter' ? 'bg-green-600 text-white' : 'bg-white text-green-700 border-green-600'} transition-colors`}
                    onClick={() => setPromptType((prev) => ({ ...prev, [i]: 'starter' }))}
                  >
                    💬 Conversation Starters
                  </button>
                </div>
                {/* Descriptions */}
                {promptType[i] !== 'starter' ? (
                  <div className="text-sm text-blue-700 mb-2">
                    <span className="font-semibold">Ice Breakers:</span> Fun, light questions to break the ice and get the conversation started. Great for first messages or when things feel awkward.
                  </div>
                ) : (
                  <div className="text-sm text-green-700 mb-2">
                    <span className="font-semibold">Conversation Starters:</span> Thoughtful prompts based on your shared interests and values. Perfect for deeper, more meaningful conversations.
                  </div>
                )}
                {/* Prompt Buttons and Results */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {promptType[i] !== 'starter' ? (
                    <button
                      className="px-3 py-1 bg-blue-500 text-white rounded text-sm disabled:opacity-50"
                      onClick={() => handleFetchIceBreakers(i, match)}
                      disabled={iceBreakersLoading[i]}
                    >
                      {iceBreakersLoading[i] ? "Loading..." : "Show Ice Breakers"}
                    </button>
                  ) : (
                    <button
                      className="px-3 py-1 bg-green-500 text-white rounded text-sm disabled:opacity-50"
                      onClick={() => handleFetchStarters(i, match)}
                      disabled={startersLoading[i]}
                    >
                      {startersLoading[i] ? "Loading..." : "Show Conversation Starters"}
                    </button>
                  )}
                  <button
                    className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600"
                    onClick={() => {
                      const matchProfile = getPair(match)[1];
                      const targetUserId = matchProfile.id;
                      router.push(`/chat?user=${targetUserId}`);
                    }}
                  >
                    Start Chat
                  </button>
                </div>
                {/* Results */}
                {promptType[i] !== 'starter' ? (
                  <>
                    {iceBreakersError[i] && <div className="text-red-600 text-sm mt-2">{iceBreakersError[i]}</div>}
                    {iceBreakers[i] && (
                      <ul className="mt-2 text-sm bg-blue-50 rounded p-2">
                        {iceBreakers[i].map((s, idx) => <li key={idx}>🎲 {s}</li>)}
                      </ul>
                    )}
                  </>
                ) : (
                  <>
                    {startersError[i] && <div className="text-red-600 text-sm mt-2">{startersError[i]}</div>}
                    {starters[i] && (
                      <ul className="mt-2 text-sm bg-green-50 rounded p-2">
                        {starters[i].map((s, idx) => <li key={idx}>💡 {s}</li>)}
                      </ul>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}