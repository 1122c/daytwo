"use client";
import { useEffect, useState } from 'react';
import { auth } from '@/services/firebase';
import type { User } from 'firebase/auth';

interface Match {
  group: Array<{
    id: string;
    name: string;
    values: string[];
    goals: string[];
  }>;
  explanation?: string;
}

interface UserMatchesBarProps {
  className?: string;
}

export default function UserConnectionsBar({ className = '' }: UserMatchesBarProps) {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [connections, setConnections] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setAuthUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchConnections() {
      if (!authUser) return;
      setLoading(true);
      setError('');
      try {
        const idToken = await authUser.getIdToken();
        const res = await fetch('/api/match', {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });
        if (!res.ok) throw new Error('Failed to fetch connections');
        const data = await res.json();
        setConnections(data.matches?.slice(0, 5) || []);
      } catch {
        setError('Error loading connections.');
      } finally {
        setLoading(false);
      }
    }
    fetchConnections();
  }, [authUser]);

  if (!authUser) return null;

  return (
    <div className={`mb-8 p-4 bg-blue-50 rounded shadow ${className}`}>
      <h3 className="font-semibold mb-2">Your Top Connections</h3>
      {loading && <div className="text-gray-500">Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && connections.length === 0 && <div className="text-gray-500">No connections found.</div>}
      <ul className="space-y-3">
        {connections.map((connection, idx) => (
          <li key={idx} className="border rounded p-3 bg-white">
            <div className="font-bold text-md mb-1">
              {connection.group.map((user, i) => (
                <span key={user.id}>
                  <a href={`/profile/${user.id}`} className="underline text-blue-700 hover:text-blue-900">{user.name}</a>
                  {i < connection.group.length - 1 && ', '}
                </span>
              ))}
            </div>
            <div className="text-sm text-gray-700">
              <span className="font-semibold">Values:</span> {connection.group.map(u => u.values?.join(', ')).join(' | ')}
            </div>
            <div className="text-sm text-gray-700">
              <span className="font-semibold">Goals:</span> {connection.group.map(u => u.goals?.join(', ')).join(' | ')}
            </div>
            {connection.explanation && <div className="text-xs text-gray-500 mt-1">{connection.explanation}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
} 