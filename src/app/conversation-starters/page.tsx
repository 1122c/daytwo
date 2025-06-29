"use client";
import { useEffect, useState } from 'react';
import { auth, db } from '@/services/firebase';
import { collection, getDocs } from 'firebase/firestore';
import type { UserProfile } from '@/services/websocketService';
import type { User } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function ConversationStartersPage() {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [starters, setStarters] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => setAuthUser(user));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchUsers() {
      const snap = await getDocs(collection(db, 'profiles'));
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile)));
    }
    fetchUsers();
  }, []);

  async function handleGenerate() {
    setLoading(true);
    setError('');
    setStarters([]);
    try {
      if (!authUser || !selectedUserId) throw new Error('You must be logged in and select a user.');
      console.log('authUser:', authUser);
      const idToken = await authUser.getIdToken();
      console.log('idToken:', idToken);
      const selfProfile = users.find(u => u.id === authUser.uid);
      const otherProfile = users.find(u => u.id === selectedUserId);
      if (!selfProfile || !otherProfile) throw new Error('User not found');
      const res = await fetch('/api/conversation-starters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ userProfile: selfProfile, matchProfile: otherProfile }),
      });
      console.log('response status:', res.status);
      if (!res.ok) throw new Error('Failed to generate conversation starters');
      const data = await res.json();
      setStarters(data.starters || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error generating conversation starters');
    } finally {
      setLoading(false);
    }
  }

  function handleStartChat() {
    if (!selectedUserId) return;
    // Navigate to chat page with the selected user
    router.push(`/chat?user=${selectedUserId}`);
  }

  return (
    <div className="max-w-xl mx-auto bg-white rounded shadow p-8 mt-8">
      <h1 className="text-2xl font-bold mb-4">Conversation Starters</h1>
      <div className="mb-4">Generate conversation starters between you and another user.</div>
      {!authUser && <div className="text-red-600 mb-4">You must be logged in to use this feature.</div>}
      <div className="mb-4">
        <label className="block mb-1 font-semibold">Select a user:</label>
        <select
          className="border rounded px-3 py-2 w-full"
          value={selectedUserId}
          onChange={e => setSelectedUserId(e.target.value)}
          disabled={!authUser}
        >
          <option value="">-- Select --</option>
          {users.filter(u => u.id !== authUser?.uid).map(u => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      </div>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        onClick={handleGenerate}
        disabled={loading || !selectedUserId || !authUser}
      >
        {loading ? 'Generating...' : 'Generate Conversation Starters'}
      </button>
      {error && <div className="text-red-600 mt-2">{error}</div>}
      {starters.length > 0 && (
        <div className="mt-4">
          <ul className="bg-blue-50 rounded p-4 mb-4">
            {starters.map((s, i) => <li key={i}>💬 {s}</li>)}
          </ul>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            onClick={handleStartChat}
          >
            Start Chat with {users.find(u => u.id === selectedUserId)?.name}
          </button>
        </div>
      )}
    </div>
  );
} 