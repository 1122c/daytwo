import type { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';
import { adminAuth } from '@/services/firebaseAdmin';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
    await adminAuth.verifyIdToken(idToken);
    console.log('Token verified successfully for user:', idToken);
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }

  const { userProfile, matchProfile } = req.body;
  if (!userProfile || !matchProfile) {
    return res.status(400).json({ error: 'userProfile and matchProfile are required' });
  }

  const prompt = `
You are an expert at creating thoughtful, open-ended conversation starters for people who want to connect more deeply.
Given the following two user profiles, generate 5 unique, engaging, and open-ended conversation starters that would help them discover common ground, learn about each other's perspectives, or spark meaningful discussion.
Make the starters relevant to their shared or unique interests, values, or goals. Avoid yes/no questions and keep the tone friendly and curious.

Examples:
- What's a value you both share, and how does it show up in your life?
- What's a goal you're working toward, and what inspired it?
- How do your interests influence your daily routines?
- What's a challenge you've faced recently, and what did you learn from it?
- If you could collaborate on any project, what would it be?

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

Generate exactly 5 conversation starters. Return ONLY a JSON array of strings, no other text.
`;

  try {
    console.log('Calling OpenAI API for conversation starters');
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 400,
    });

    let starters: string[] = [];
    try {
      const text = completion.choices[0].message.content?.trim() || '';
      console.log('Raw OpenAI response:', text);
      starters = JSON.parse(text);
    } catch (parseError) {
      console.error('Failed to parse JSON, using fallback:', parseError);
      const text = completion.choices[0].message.content?.trim() || '';
      starters = text.split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => line.replace(/^[-*"'\d\.\s]+/, '').replace(/["']$/, '').trim())
        .filter(line => line.length > 10)
        .slice(0, 5);
    }

    console.log('Generated conversation starters:', starters);
    res.status(200).json({ starters });

  } catch (error) {
    console.error('Error generating conversation starters:', error);
    res.status(500).json({ error: 'Failed to generate conversation starters' });
  }
} 