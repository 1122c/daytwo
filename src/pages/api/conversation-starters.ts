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
  const prompt = `Generate 3 engaging conversation starters based on these user profiles:

User 1 (${userProfile.name}):
- Core Values: ${userProfile.values?.join(', ') || ''}
- Personal Goals: ${userProfile.goals?.join(', ') || ''}

User 2 (${matchProfile.name}):
- Core Values: ${matchProfile.values?.join(', ') || ''}
- Personal Goals: ${matchProfile.goals?.join(', ') || ''}

Generate 3 conversation starters that:
1. Reference shared values or goals
2. Are open-ended and encourage discussion
3. Show genuine interest in the other person
4. Are professional but friendly
5. Avoid generic or cliché questions

Format each starter on a new line.`;

  try {
    const openaiRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/openai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    const data = await openaiRes.json();
    if (!data.result) throw new Error('No result from OpenAI');
    const starters = data.result.split('\n').filter(Boolean);
    res.status(200).json({ starters });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate conversation starters' });
  }
} 