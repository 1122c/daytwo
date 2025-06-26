// NOTE: This is a basic matching API for testing. Will be improved later with clustering, filtering, etc.
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/services/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { simpleMatch, Profile } from '@/services/matchingService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const querySnapshot = await getDocs(collection(db, 'profiles'));
    const profiles: Profile[] = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || 'Anonymous',
        values: Array.isArray(data.values) ? data.values : [],
        goals: Array.isArray(data.goals) ? data.goals : [],
        preferences: Array.isArray(data.preferences) ? data.preferences : [],
        publicProfiles: typeof data.publicProfiles === 'object' && data.publicProfiles !== null ? data.publicProfiles : {},
      };
    });
    //may want to validate/shape profiles here
    const matches = simpleMatch(profiles);
    res.status(200).json({ matches });
  } catch {
    res.status(500).json({ error: 'Failed to generate matches' });
  }
} 