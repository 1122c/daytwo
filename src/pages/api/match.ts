// NOTE: This is a basic matching API for testing. Will be improved later with clustering, filtering, etc.
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/services/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { simpleMatch } from '@/services/matchingService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const querySnapshot = await getDocs(collection(db, 'profiles'));
    const profiles = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    //may want to validate/shape profiles here
    const matches = simpleMatch(profiles as any[]); // Type assertion for now
    res.status(200).json({ matches });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate matches' });
  }
} 