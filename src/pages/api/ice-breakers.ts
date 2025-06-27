import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userProfile, matchProfile } = req.body;
  if (!userProfile || !matchProfile) {
    return res.status(400).json({ error: 'userProfile and matchProfile are required' });
  }

  // Compose the prompt using the current profile structure
  const prompt = `Generate 3 fun ice breaker activities based on these user profiles:

User 1 (${userProfile.name}):
- Core Values: ${userProfile.values?.join(', ') || ''}
- Personal Goals: ${userProfile.goals?.join(', ') || ''}
- Communication Preferences: ${userProfile.communicationStyle?.join(', ') || ''}

User 2 (${matchProfile.name}):
- Core Values: ${matchProfile.values?.join(', ') || ''}
- Personal Goals: ${matchProfile.goals?.join(', ') || ''}
- Communication Preferences: ${matchProfile.communicationStyle?.join(', ') || ''}

Generate 3 ice breaker activities that:
1. Are appropriate for their communication preferences
2. Help build rapport quickly
3. Are engaging and fun
4. Can be done in a short time
5. Don't require special equipment

Format each activity on a new line.`;

  try {
    const openaiRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/openai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    const data = await openaiRes.json();
    if (!data.result) throw new Error('No result from OpenAI');
    const activities = data.result.split('\n').filter(Boolean);
    res.status(200).json({ activities });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate ice breakers' });
  }
} 