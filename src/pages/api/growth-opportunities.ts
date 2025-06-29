import type { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';
import { adminAuth } from '@/services/firebaseAdmin';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }

  const { userProfile, matchProfile } = req.body;
  if (!userProfile || !matchProfile) {
    return res.status(400).json({ error: 'userProfile and matchProfile are required' });
  }

  const prompt = `
Given the following two user profiles, generate 3 personalized, actionable growth opportunities for them to work on together or individually. Make them relevant to their shared or unique interests, values, or goals. Keep them positive, practical, and inspiring.

User 1:
- Name: ${userProfile.name}
- Interests: ${userProfile.interests?.join(', ') || 'N/A'}
- Values: ${userProfile.values?.join(', ') || 'N/A'}
- Goals: ${userProfile.goals?.join(', ') || 'N/A'}

User 2:
- Name: ${matchProfile.name}
- Interests: ${matchProfile.interests?.join(', ') || 'N/A'}
- Values: ${matchProfile.values?.join(', ') || 'N/A'}
- Goals: ${matchProfile.goals?.join(', ') || 'N/A'}

Generate exactly 3 growth opportunities. Return ONLY a JSON array of strings, no other text.
`;

  try {
    console.log('Calling OpenAI API for growth opportunities');
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 400,
    });

    let opportunities: string[] = [];
    try {
      const text = completion.choices[0].message.content?.trim() || '';
      console.log('Raw OpenAI response:', text);
      opportunities = JSON.parse(text);
    } catch (parseError) {
      console.error('Failed to parse JSON, using fallback:', parseError);
      // Fallback: split by lines and clean up
      const text = completion.choices[0].message.content?.trim() || '';
      opportunities = text.split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => line.replace(/^[-*"'\d\.]\s*/, '').replace(/["']$/, '').trim())
        .filter(line => line.length > 20)
        .slice(0, 3);
    }

    console.log('Generated growth opportunities:', opportunities);
    res.status(200).json({ opportunities });

  } catch (error) {
    console.error('Error generating growth opportunities:', error);
    res.status(500).json({ error: 'Failed to generate growth opportunities' });
  }
}