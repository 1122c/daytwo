// NOTE: This is a basic matching API for testing. Will be improved later with clustering, filtering, etc.
// Query params: minSharedValues, minSharedGoals, minSharedPreferences, groupSize (2 or 3)
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/services/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { flexibleMatch, Profile } from '@/services/matchingService';
import { generateMatchExplanation } from '@/services/websocketService';
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
        communicationStyle: Array.isArray(data.communicationStyle) ? data.communicationStyle : [],
        interests: Array.isArray(data.interests) ? data.interests : [],
      };
    });
    // Parse query params for matching options
    const minSharedValues = req.query.minSharedValues ? parseInt(req.query.minSharedValues as string, 10) : undefined;
    const minSharedGoals = req.query.minSharedGoals ? parseInt(req.query.minSharedGoals as string, 10) : undefined;
    const minSharedPreferences = req.query.minSharedPreferences ? parseInt(req.query.minSharedPreferences as string, 10) : undefined;
    const groupSize = req.query.groupSize ? parseInt(req.query.groupSize as string, 10) as 2 | 3 : undefined;
    const minSharedInterests = req.query.minSharedInterests ? parseInt(req.query.minSharedInterests as string, 10) : 0;
    const matches = flexibleMatch(profiles, {
      minSharedValues,
      minSharedGoals,
      minSharedPreferences,
      groupSize,
      minSharedInterests,
    });
    // Add GPT explanations for the top 10 matches
    const matchesWithExplanations = await Promise.all(
      matches.slice(0, 10).map(async (match) => {
        // Ensure name is always a string for GPT
        const groupWithNames = match.group.map((p) => ({ ...p, name: p.name || 'Anonymous' }));
        const explanation = await generateMatchExplanation(groupWithNames);
        return { ...match, explanation };
      })
    );
    // For the rest, just return without explanation
    const rest = matches.slice(10).map((match) => ({ ...match, explanation: null }));
    res.status(200).json({ matches: [...matchesWithExplanations, ...rest] });
  } catch {
    res.status(500).json({ error: 'Failed to generate matches' });
  }
} 