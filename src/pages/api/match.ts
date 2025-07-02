/// NOTE: This is a basic matching API for testing. Will be improved later with clustering, filtering, etc.
// Query params: minSharedValues, minSharedGoals, minSharedPreferences, groupSize (2 or 3)
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/services/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { generateMatches, UserProfile } from '@/services/matchingService';
import { adminAuth } from '@/services/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('=== MATCH API CALLED ===');
  // Auth check
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ Missing auth header');
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }
  const idToken = authHeader.split('Bearer ')[1];
  let currentUserId = '';
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    currentUserId = decoded.uid;
    console.log('✅ Auth verified for user:', currentUserId);
  } catch (error) {
    console.log('❌ Auth failed:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }

  try {
    console.log('📊 Fetching profiles from Firebase...');
    const querySnapshot = await getDocs(collection(db, 'profiles'));
    console.log('📊 Found', querySnapshot.docs.length, 'profiles');
    const profiles: UserProfile[] = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || 'Anonymous',
        values: {
          coreValues: Array.isArray(data.values?.coreValues) ? data.values.coreValues : [],
          personalGoals: Array.isArray(data.values?.personalGoals) ? data.values.personalGoals : [],
          preferredCommunication: Array.isArray(data.values?.preferredCommunication) ? data.values.preferredCommunication : [],
          availability: {
            timezone: data.values?.availability?.timezone || '',
            preferredTimes: Array.isArray(data.values?.availability?.preferredTimes) ? data.values.availability.preferredTimes : [],
          },
        },
        bio: data.bio || '',
      };
    });
    console.log('🔍 Sample profile:', profiles[0]);
    const currentUser = profiles.find(p => p.id === currentUserId);
    if (!currentUser) {
      return res.status(404).json({ error: 'Current user profile not found' });
    }
    // Remove current user from potential matches
    const potentialMatches = profiles.filter(p => p.id !== currentUserId);
    // Generate matches for the current user
    const matches = await generateMatches(currentUser, potentialMatches, 10);
    res.status(200).json({ matches });
  } catch (error) {
    console.error('💥 MATCH API ERROR:', error);
    res.status(500).json({ error: 'Failed to generate connections' });
  }
}