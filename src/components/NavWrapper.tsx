"use client";
import React, { ReactNode, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/services/firebase';
import type { UserProfile } from '@/services/websocketService';
import { db } from '@/services/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';

type Notification = {
  id: string;
  type: 'connection' | 'chat';
  fromUserId?: string;
  lastMessage?: string;
  lastMessageSender?: string;
};

export default function NavWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const hideNav = pathname === '/' || pathname === '/login' || pathname === '/signup';
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // Listen for incoming connection requests and new chats
  useEffect(() => {
    if (!user) return;
    // Listen for incoming connection requests
    const reqQuery = query(collection(db, 'matchRequests'), where('toUserId', '==', user.uid), where('status', '==', 'pending'));
    const unsubReq = onSnapshot(reqQuery, (snap) => {
      const reqs = snap.docs.map(doc => ({ id: doc.id, type: 'connection' as const, ...doc.data() }));
      setNotifications((prev) => {
        // Remove old connection requests, add new
        const others = prev.filter(n => n.type !== 'connection');
        return [...others, ...reqs];
      });
    });
    // Listen for new conversations (new messages)
    const convQuery = query(collection(db, 'conversations'), where('participants', 'array-contains', user.uid), orderBy('lastMessageTime', 'desc'));
    const unsubConv = onSnapshot(convQuery, (snap) => {
      const chats = snap.docs
        .filter(doc => {
          const data = doc.data();
          // Only notify if lastMessage exists and lastMessageSender is not the current user
          return data.lastMessage && data.lastMessageSender && data.lastMessageSender !== user.uid;
        })
        .map(doc => ({ id: doc.id, type: 'chat' as const, ...doc.data() }));
      setNotifications((prev) => {
        // Remove old chat notifications, add new
        const others = prev.filter(n => n.type !== 'chat');
        return [...others, ...chats];
      });
    });
    return () => { unsubReq(); unsubConv(); };
  }, [user]);

  const unreadCount = notifications.length;

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
            {/* <a href="/onboarding" className="px-3 py-1 rounded-md bg-gray-800 text-white no-underline hover:bg-blue-600 transition-colors">Onboarding</a> */}
            <a href="/dashboard" className="px-3 py-1 rounded-md bg-gray-800 text-white no-underline hover:bg-blue-600 transition-colors">Dashboard</a>
            <a href="/discover" className="px-3 py-1 rounded-md bg-gray-800 text-white no-underline hover:bg-blue-600 transition-colors">Discover Profiles</a>
            <a href="/connections" className="px-3 py-1 rounded-md bg-gray-800 text-white no-underline hover:bg-blue-600 transition-colors">Connections</a>
            <a href="/chat" className="px-3 py-1 rounded-md bg-gray-800 text-white no-underline hover:bg-blue-600 transition-colors">Chat</a>
            <div className="relative">
              <button
                className="relative px-3 py-1 rounded-md bg-gray-800 text-white hover:bg-blue-600 transition-colors"
                onClick={() => setShowNotifDropdown((v) => !v)}
                aria-label="Notifications"
              >
                <span className="material-icons align-middle">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs px-1.5 py-0.5">{unreadCount}</span>
                )}
              </button>
              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white text-black rounded shadow z-50 max-h-80 overflow-y-auto">
                  <div className="p-2 font-bold border-b">Notifications</div>
                  {notifications.length === 0 ? (
                    <div className="p-2 text-gray-500">No notifications</div>
                  ) : (
                    <ul>
                      {notifications.map((notif) => (
                        <li key={notif.id} className="p-3 border-b last:border-b-0">
                          {notif.type === 'connection' ? (
                            <span>New connection request from <b>{notif.fromUserId}</b></span>
                          ) : notif.type === 'chat' ? (
                            <span>New message in a chat</span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <button onClick={handleLogout} className="px-3 py-1 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors ml-2">Logout</button>
          </div>
        </nav>
      )}
      {children}
    </>
  );
} 