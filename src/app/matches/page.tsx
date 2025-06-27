"use client";
import { useEffect, useState } from "react";
import { auth } from '@/services/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

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

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // New state for AI suggestions
  const [starters, setStarters] = useState<Record<number, string[]>>({});
  const [startersLoading, setStartersLoading] = useState<Record<number, boolean>>({});
  const [startersError, setStartersError] = useState<Record<number, string>>({});
  const [iceBreakers, setIceBreakers] = useState<Record<number, string[]>>({});
  const [iceBreakersLoading, setIceBreakersLoading] = useState<Record<number, boolean>>({});
  const [iceBreakersError, setIceBreakersError] = useState<Record<number, string>>({});
  const [growthSuggestions, setGrowthSuggestions] = useState<Record<number, string[]>>({});
  const [growthLoading, setGrowthLoading] = useState<Record<number, boolean>>({});
  const [growthError, setGrowthError] = useState<Record<number, string>>({});
  const router = useRouter();

  useEffect(() => {
    async function fetchMatches() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/match");
        const data = await res.json();
        setMatches(data.matches || []);
      } catch {
        setError("Failed to load matches.");
      } finally {
        setLoading(false);
      }
    }
    fetchMatches();
  }, []);

  // Helper to get the first two profiles in a match group
  function getPair(match: Match) {
    return match.group.length >= 2 ? [match.group[0], match.group[1]] : [match.group[0], match.group[0]];
  }

  async function handleFetchStarters(i: number, match: Match) {
    setStartersLoading((prev) => ({ ...prev, [i]: true }));
    setStartersError((prev) => ({ ...prev, [i]: "" }));
    const [userProfile, matchProfile] = getPair(match);
    try {
      const res = await fetch("/api/conversation-starters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      const res = await fetch("/api/ice-breakers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  async function handleFetchGrowthSuggestions(i: number, match: Match) {
    setGrowthLoading((prev) => ({ ...prev, [i]: true }));
    setGrowthError((prev) => ({ ...prev, [i]: "" }));
    const [userProfile, matchProfile] = getPair(match);
    try {
      const res = await fetch("/api/growth-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userProfile, matchProfile }),
      });
      const data = await res.json();
      if (data.suggestions) {
        setGrowthSuggestions((prev) => ({ ...prev, [i]: data.suggestions }));
      } else {
        setGrowthError((prev) => ({ ...prev, [i]: "No suggestions found." }));
      }
    } catch {
      setGrowthError((prev) => ({ ...prev, [i]: "Failed to fetch growth suggestions." }));
    } finally {
      setGrowthLoading((prev) => ({ ...prev, [i]: false }));
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-center">Your Matches</h1>
          <button
            className="text-red-600 hover:underline text-sm"
            onClick={async () => {
              await signOut(auth);
              router.push('/');
            }}
          >
            Logout
          </button>
        </div>
        {loading ? (
          <div className="text-center text-gray-500">Loading matches...</div>
        ) : error ? (
          <div className="text-center text-red-600">{error}</div>
        ) : matches.length === 0 ? (
          <div className="text-center text-gray-500">No matches found.</div>
        ) : (
          <div className="grid gap-6">
            {matches.map((match, i) => (
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
                {/* AI Suggestions Buttons and Results */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm disabled:opacity-50"
                    onClick={() => handleFetchStarters(i, match)}
                    disabled={startersLoading[i]}
                  >
                    {startersLoading[i] ? "Loading..." : "Show Conversation Starters"}
                  </button>
                  <button
                    className="px-3 py-1 bg-green-500 text-white rounded text-sm disabled:opacity-50"
                    onClick={() => handleFetchIceBreakers(i, match)}
                    disabled={iceBreakersLoading[i]}
                  >
                    {iceBreakersLoading[i] ? "Loading..." : "Show Ice Breakers"}
                  </button>
                  <button
                    className="px-3 py-1 bg-purple-500 text-white rounded text-sm disabled:opacity-50"
                    onClick={() => handleFetchGrowthSuggestions(i, match)}
                    disabled={growthLoading[i]}
                  >
                    {growthLoading[i] ? "Loading..." : "Show Growth Suggestions"}
                  </button>
                </div>
                {/* Results */}
                {startersError[i] && <div className="text-red-600 text-sm mt-2">{startersError[i]}</div>}
                {starters[i] && (
                  <ul className="mt-2 text-sm bg-blue-50 rounded p-2">
                    {starters[i].map((s, idx) => <li key={idx}>💬 {s}</li>)}
                  </ul>
                )}
                {iceBreakersError[i] && <div className="text-red-600 text-sm mt-2">{iceBreakersError[i]}</div>}
                {iceBreakers[i] && (
                  <ul className="mt-2 text-sm bg-green-50 rounded p-2">
                    {iceBreakers[i].map((s, idx) => <li key={idx}>🎲 {s}</li>)}
                  </ul>
                )}
                {growthError[i] && <div className="text-red-600 text-sm mt-2">{growthError[i]}</div>}
                {growthSuggestions[i] && (
                  <ul className="mt-2 text-sm bg-purple-50 rounded p-2">
                    {growthSuggestions[i].map((s, idx) => <li key={idx}>🌱 {s}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 