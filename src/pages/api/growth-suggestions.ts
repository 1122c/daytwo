import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth } from '@/services/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

  const { userProfile, matchProfile } = req.body;
  if (!userProfile || !matchProfile) {
    return res.status(400).json({ error: 'userProfile and matchProfile are required' });
  }

  // Compose the prompt using the current profile structure
  const prompt = `Generate 3 growth and learning opportunities based on these user profiles:

User 1 (${userProfile.name}):
- Core Values: ${userProfile.values?.join(', ') || ''}
- Personal Goals: ${userProfile.goals?.join(', ') || ''}

User 2 (${matchProfile.name}):
- Core Values: ${matchProfile.values?.join(', ') || ''}
- Personal Goals: ${matchProfile.goals?.join(', ') || ''}

Generate 3 growth opportunities that:
1. Leverage each person's strengths
2. Address areas for development
3. Are mutually beneficial
4. Are specific and actionable
5. Align with their values and goals

Format each suggestion on a new line.`;

  try {
    const openaiRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/openai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    const data = await openaiRes.json();
    if (!data.result) throw new Error('No result from OpenAI');
    const suggestions = data.result.split('\n').filter(Boolean);
    res.status(200).json({ suggestions });
  } catch {
    res.status(500).json({ error: 'Failed to generate growth suggestions' });
  }
} 