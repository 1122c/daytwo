"use client";
import React, { ReactNode, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/services/firebase';
import type { UserProfile } from '@/services/websocketService';

export default function NavWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const hideNav = pathname === '/' || pathname === '/login' || pathname === '/signup';
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearchLoading(true);
    setSearchError('');
    setSearchResults([]);
    setShowDropdown(false);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/searchUsers?query=${encodeURIComponent(searchQuery)}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      if (!res.ok) throw new Error('Failed to search users');
      const data = await res.json();
      setSearchResults(data.users || []);
      setShowDropdown(true);
    } catch {
      setSearchError('Error searching users.');
    } finally {
      setSearchLoading(false);
    }
  }

  async function handleLogout() {
    await signOut(auth);
    router.push('/');
  }

  return (
    <>
      {!hideNav && (
        <nav className="w-full flex items-center justify-between px-4 py-4 bg-gray-900 text-white text-sm mb-8 shadow relative">
          <div>ConnectMind</div>
          <div className="flex gap-3 items-center">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                className="px-2 py-1 rounded border border-gray-300 text-black"
                placeholder="Search users..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setShowDropdown(false)}
              />
              <button
                type="submit"
                className="ml-2 px-2 py-1 bg-blue-600 text-white rounded"
                disabled={searchLoading || !searchQuery.trim()}
              >
                {searchLoading ? '...' : 'Search'}
              </button>
              {showDropdown && (searchResults.length > 0 || searchError) && (
                <div className="absolute left-0 mt-2 w-80 bg-white text-black rounded shadow z-50 max-h-80 overflow-y-auto">
                  {searchError && <div className="text-red-600 p-2">{searchError}</div>}
                  {searchResults.length > 0 && (
                    <ul className="divide-y divide-gray-200">
                      {searchResults.map((user) => (
                        <li key={user.id} className="p-3 hover:bg-blue-50 cursor-pointer" onClick={() => { router.push(`/discover?user=${user.id}`); setShowDropdown(false); setSearchQuery(''); }}>
                          <div className="font-bold">{user.name}</div>
                          <div className="text-xs text-gray-600">Values: {user.values?.join(', ')}</div>
                          <div className="text-xs text-gray-600">Goals: {user.goals?.join(', ')}</div>
                          <div className="text-xs text-gray-600">Preferences: {user.preferences?.join(', ')}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                  {searchResults.length === 0 && !searchError && (
                    <div className="p-2 text-gray-500">No users found.</div>
                  )}
                </div>
              )}
            </form>
            <a href="/onboarding" className="px-3 py-1 rounded-md bg-gray-800 text-white no-underline hover:bg-blue-600 transition-colors">Onboarding</a>
            <a href="/discover" className="px-3 py-1 rounded-md bg-gray-800 text-white no-underline hover:bg-blue-600 transition-colors">Discover Profiles</a>
            <a href="/matches" className="px-3 py-1 rounded-md bg-gray-800 text-white no-underline hover:bg-blue-600 transition-colors">Matches</a>
            <a href="/chat" className="px-3 py-1 rounded-md bg-gray-800 text-white no-underline hover:bg-blue-600 transition-colors">Chat</a>
            <a href="/conversation-starters" className="px-3 py-1 rounded-md bg-gray-800 text-white no-underline hover:bg-blue-600 transition-colors">Conversation Starters</a>
            <button onClick={handleLogout} className="px-3 py-1 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors ml-2">Logout</button>
          </div>
        </nav>
      )}
      {children}
    </>
  );
} 