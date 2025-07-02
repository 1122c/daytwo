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
          communicationStyle: Array.isArray(data.communicationStyle) ? data.communicationStyle : [],
          interests: Array.isArray(data.interests) ? data.interests : [],
          connectionType: Array.isArray(data.connectionType) ? data.connectionType : [],
          growthAreas: Array.isArray(data.growthAreas) ? data.growthAreas : [],
          availability: Array.isArray(data.availability) ? data.availability : [],
          location: data.location || '',
          timezone: data.timezone || '',
          identityTags: Array.isArray(data.identityTags) ? data.identityTags : [],
          publicProfiles: typeof data.publicProfiles === 'object' && data.publicProfiles !== null ? data.publicProfiles : {},
          email: data.email || '',
        } as UserProfile & {
          communicationStyle?: string[];
          interests?: string[];
          connectionType?: string[];
          growthAreas?: string[];
          availability?: string[];
          location?: string;
          timezone?: string;
          identityTags?: string[];
          email?: string;
        };
      })
      .filter(profile => {
        return (
          profile.name.toLowerCase().includes(q) ||
          profile.values.some(v => v.toLowerCase().includes(q)) ||
          profile.goals.some(g => g.toLowerCase().includes(q)) ||
          profile.preferences.some(p => p.toLowerCase().includes(q)) ||
          (profile.communicationStyle && profile.communicationStyle.some(cs => cs.toLowerCase().includes(q))) ||
          (profile.interests && profile.interests.some(i => i.toLowerCase().includes(q))) ||
          (profile.connectionType && profile.connectionType.some(ct => ct.toLowerCase().includes(q))) ||
          (profile.growthAreas && profile.growthAreas.some(ga => ga.toLowerCase().includes(q))) ||
          (profile.availability && profile.availability.some(a => a.toLowerCase().includes(q))) ||
          (profile.location && profile.location.toLowerCase().includes(q)) ||
          (profile.timezone && profile.timezone.toLowerCase().includes(q)) ||
          (profile.identityTags && profile.identityTags.some(tag => tag.toLowerCase().includes(q))) ||
          (profile.publicProfiles && Object.values(profile.publicProfiles).some(url => typeof url === 'string' && url.toLowerCase().includes(q))) ||
          (profile.email && profile.email.toLowerCase().includes(q))
        );
      });
    res.status(200).json({ users: matches });
  } catch {
    res.status(500).json({ error: 'Failed to search users' });
  }
} 