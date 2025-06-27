import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/services/firebase';
import { collection, getDocs } from 'firebase/firestore';
import type { UserProfile } from '@/services/websocketService';
import { adminAuth } from '@/services/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Auth check
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }
  const idToken = authHeader.split('Bearer ')[1];
  try {
    await adminAuth.verifyIdToken(idToken);
  } catch {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }

  const { query } = req.query;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid query parameter' });
  }
  try {
    const querySnapshot = await getDocs(collection(db, 'profiles'));
    const q = query.toLowerCase();
    const matches: UserProfile[] = querySnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || 'Anonymous',
          values: Array.isArray(data.values) ? data.values : [],
          goals: Array.isArray(data.goals) ? data.goals : [],
          preferences: Array.isArray(data.preferences) ? data.preferences : [],
          publicProfiles: typeof data.publicProfiles === 'object' && data.publicProfiles !== null ? data.publicProfiles : {},
        } as UserProfile;
      })
      .filter(profile => {
        return (
          profile.name.toLowerCase().includes(q) ||
          profile.values.some(v => v.toLowerCase().includes(q)) ||
          profile.goals.some(g => g.toLowerCase().includes(q)) ||
          profile.preferences.some(p => p.toLowerCase().includes(q))
        );
      });
    res.status(200).json({ users: matches });
  } catch {
    res.status(500).json({ error: 'Failed to search users' });
  }
} 