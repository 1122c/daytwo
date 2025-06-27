import type { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    console.log('Calling OpenAI API for conversation starters'); // Debug log
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are an expert at creating meaningful conversation starters.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    const result = response.choices[0]?.message?.content?.trim();
    if (!result) {
      throw new Error('No result from OpenAI');
    }

    const starters = result.split('\n').filter(Boolean);
    console.log('Generated conversation starters:', starters); // Debug log
    
    res.status(200).json({ starters });
  } catch (error) {
    console.error('Error generating conversation starters:', error);
    res.status(500).json({ error: 'Failed to generate conversation starters' });
  }
}