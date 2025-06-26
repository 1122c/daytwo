// NOTE: This is a basic matching API for testing. Will be improved later with clustering, filtering, etc.
// Query params: minSharedValues, minSharedGoals, minSharedPreferences, groupSize (2 or 3)
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/services/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { flexibleMatch, Profile } from '@/services/matchingService';

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
    // Parse query params for matching options
    const minSharedValues = req.query.minSharedValues ? parseInt(req.query.minSharedValues as string, 10) : undefined;
    const minSharedGoals = req.query.minSharedGoals ? parseInt(req.query.minSharedGoals as string, 10) : undefined;
    const minSharedPreferences = req.query.minSharedPreferences ? parseInt(req.query.minSharedPreferences as string, 10) : undefined;
    const groupSize = req.query.groupSize ? parseInt(req.query.groupSize as string, 10) as 2 | 3 : undefined;
    const matches = flexibleMatch(profiles, {
      minSharedValues,
      minSharedGoals,
      minSharedPreferences,
      groupSize,
    });
    res.status(200).json({ matches });
  } catch {
    res.status(500).json({ error: 'Failed to generate matches' });
  }
} 