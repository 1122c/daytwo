"use client";
import { useEffect, useState } from "react";

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

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Your Matches</h1>
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 