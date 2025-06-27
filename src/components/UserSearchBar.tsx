"use client";
import { useEffect, useState } from 'react';
import { auth } from '@/services/firebase';
import type { User } from 'firebase/auth';
import type { UserProfile } from '@/services/websocketService';

interface UserSearchBarProps {
  className?: string;
}

export default function UserSearchBar({ className = '' }: UserSearchBarProps) {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [requestStatus, setRequestStatus] = useState<{ [userId: string]: 'idle' | 'loading' | 'success' | 'error' }>({});

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setAuthUser(user);
    });
    return () => unsubscribe();
  }, []);

  if (!authUser) return null;

  async function handleUserSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearchLoading(true);
    setSearchError('');
    setSearchResults([]);
    try {
      if (!authUser) throw new Error('Not authenticated');
      const idToken = await authUser.getIdToken();
      const res = await fetch(`/api/searchUsers?query=${encodeURIComponent(searchQuery)}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      if (!res.ok) throw new Error('Failed to search users');
      const data = await res.json();
      setSearchResults(data.users || []);
    } catch {
      setSearchError('Error searching users.');
    } finally {
      setSearchLoading(false);
    }
  }

  async function handleRequestMatch(toUserId: string) {
    if (!authUser) return;
    setRequestStatus(prev => ({ ...prev, [toUserId]: 'loading' }));
    try {
      const idToken = await authUser.getIdToken();
      const res = await fetch('/api/requestMatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ toUserId }),
      });
      if (!res.ok) throw new Error('Failed to request match');
      setRequestStatus(prev => ({ ...prev, [toUserId]: 'success' }));
    } catch {
      setRequestStatus(prev => ({ ...prev, [toUserId]: 'error' }));
    }
  }

  return (
    <div className={`mb-8 p-4 bg-white rounded shadow ${className}`}>
      <form onSubmit={handleUserSearch} className="flex flex-col sm:flex-row gap-2 items-center">
        <input
          type="text"
          className="border rounded px-3 py-2 w-full sm:w-64"
          placeholder="Search users by name, value, goal, or preference..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          disabled={searchLoading || !searchQuery.trim()}
        >
          {searchLoading ? 'Searching...' : 'Search'}
        </button>
      </form>
      {searchError && <div className="text-red-600 mt-2">{searchError}</div>}
      {searchResults.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Results:</h3>
          <ul className="space-y-4">
            {searchResults.map((user) => (
              <li key={user.id} className="border rounded p-3 bg-gray-50">
                <div className="font-bold text-lg">{user.name}</div>
                <div><span className="font-semibold">Values:</span> {user.values?.join(', ')}</div>
                <div><span className="font-semibold">Goals:</span> {user.goals?.join(', ')}</div>
                <div><span className="font-semibold">Preferences:</span> {user.preferences?.join(', ')}</div>
                {user.publicProfiles?.linkedin && (
                  <div className="text-sm text-gray-600 mt-1">
                    <a href={user.publicProfiles?.linkedin} target="_blank" rel="noopener noreferrer" className="mr-2 underline">LinkedIn</a>
                  </div>
                )}
                {user.publicProfiles?.twitter && (
                  <div className="text-sm text-gray-600 mt-1">
                    <a href={user.publicProfiles?.twitter} target="_blank" rel="noopener noreferrer" className="mr-2 underline">Twitter</a>
                  </div>
                )}
                {user.publicProfiles?.instagram && (
                  <div className="text-sm text-gray-600 mt-1">
                    <a href={user.publicProfiles?.instagram} target="_blank" rel="noopener noreferrer" className="mr-2 underline">Instagram</a>
                  </div>
                )}
                {user.publicProfiles?.tiktok && (
                  <div className="text-sm text-gray-600 mt-1">
                    <a href={user.publicProfiles?.tiktok} target="_blank" rel="noopener noreferrer" className="mr-2 underline">TikTok</a>
                  </div>
                )}
                {/* Request to Match button (not for self) */}
                {user.id !== authUser?.uid && (
                  <div className="mt-2">
                    <button
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50"
                      disabled={requestStatus[user.id] === 'loading' || requestStatus[user.id] === 'success'}
                      onClick={() => handleRequestMatch(user.id)}
                    >
                      {requestStatus[user.id] === 'success'
                        ? 'Request Sent!'
                        : requestStatus[user.id] === 'loading'
                        ? 'Requesting...'
                        : 'Request to Match'}
                    </button>
                    {requestStatus[user.id] === 'error' && (
                      <div className="text-red-600 text-xs mt-1">Error sending request.</div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 