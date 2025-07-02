import type { NextApiRequest, NextApiResponse } from 'next';
import { calculateCompatibilityScore, UserProfile as AdvancedUserProfile } from '@/services/matchingService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { currentUser, profiles } = req.body;
  if (!currentUser || !Array.isArray(profiles)) {
    return res.status(400).json({ error: 'Missing currentUser or profiles' });
  }
  try {
    const scores: Record<string, number> = {};
    const self: AdvancedUserProfile = currentUser;
    profiles.forEach((profile: AdvancedUserProfile) => {
      if (profile.id === self.id) return;
      scores[profile.id] = calculateCompatibilityScore(self, profile).overallScore;
    });
    res.status(200).json({ scores });
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate compatibility scores' });
  }
} 