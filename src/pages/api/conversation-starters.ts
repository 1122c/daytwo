import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth } from '@/services/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // DEBUG: Check if environment variables are loaded
  console.log('Environment check:');
  console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? 'Present' : 'Missing');
  console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? 'Present' : 'Missing');
  console.log('FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? 'Present (length: ' + process.env.FIREBASE_PRIVATE_KEY.length + ')' : 'Missing');

  // Auth check
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }
  const idToken = authHeader.split('Bearer ')[1];
  
  try {
    console.log('Attempting to verify token...');
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    console.log('Token verified successfully for user:', decodedToken.uid);
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }

  // Rest of your code...
  const { userProfile, matchProfile } = req.body;
  if (!userProfile || !matchProfile) {
    return res.status(400).json({ error: 'userProfile and matchProfile are required' });
  }

  try {
    console.log('Using mock conversation starters');
    
    // MOCK VERSION - no OpenAI call
    const mockStarters = [
      `Both of you value ${userProfile.values?.[0] || 'growth'} - what's one way this has shaped your recent decisions?`,
      `I see you both want to ${userProfile.goals?.[0] || 'expand your network'} - what's been your most effective approach so far?`,
      `Given your shared interests, what's one book or resource that's changed your perspective recently?`
    ];
    
    console.log('Generated conversation starters:', mockStarters);
    res.status(200).json({ starters: mockStarters });

  } catch (error) {
    console.error('Error generating conversation starters:', error);
    res.status(500).json({ error: 'Failed to generate conversation starters' });
  }
} 