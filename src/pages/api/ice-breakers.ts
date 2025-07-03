import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';
import { adminAuth } from '@/services/firebaseAdmin';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth check (same as conversation-starters API)
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
You are an expert at helping people break the ice and start fun, light conversations.
Given the following two user profiles, generate 5 fun, light, and playful ice breaker questions or activities that would help them get to know each other.
Make the ice breakers relevant to their shared or unique interests, values, or goals, but keep them easy, non-serious, and not too deep.
Avoid deep or personal questions. Use a friendly, upbeat tone.

Examples:
- If you could have any superpower, what would it be?
- What's your go-to karaoke song?
- Would you rather travel to the past or the future?
- What's the silliest thing you've ever cooked?
- If you could swap lives with any character for a day, who would it be?

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

Generate exactly 5 ice breaker questions. Return ONLY a JSON array of strings, no other text.
`;

  try {
    console.log('Calling OpenAI API for ice breakers');
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 400,
    });

    // Try to parse the response as JSON
    let iceBreakers: string[] = [];
    try {
      let text = completion.choices[0].message.content?.trim() || '';
      console.log('Raw OpenAI response:', text);
      // Remove code block markers if present
      if (text.startsWith('```')) {
        text = text.replace(/^```[a-z]*\n?/i, '').replace(/```$/, '').trim();
      }
      // Remove trailing commas before closing array
      text = text.replace(/,(\s*[\]\}])/g, '$1');
      iceBreakers = JSON.parse(text);
    } catch (parseError) {
      console.error('Failed to parse JSON, using fallback:', parseError);
      // Fallback: split by lines and clean up
      const text = completion.choices[0].message.content?.trim() || '';
      iceBreakers = text.split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => line.replace(/^[-*"'\d\.]\s*/, '').replace(/["']$/, '').trim())
        .filter(line => line.length > 10)
        .slice(0, 5);
    }

    console.log('Generated ice breakers:', iceBreakers);
    res.status(200).json({ activities: iceBreakers });

  } catch (error) {
    console.error('Error generating ice breakers:', error);
    res.status(500).json({ error: 'Failed to generate ice breakers' });
  }
}