import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { userProfile, matchProfile } = req.body;

  const prompt = `
You are an expert at helping people break the ice and start fun, light conversations. 
Given the following two user profiles, generate 5 personalized ice breaker questions or activities that would help them get to know each other. 
Make the ice breakers relevant to their shared or unique interests, values, or goals. 
Keep them friendly, inclusive, and easy to answer.

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

Output as a JSON array of strings.
`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    max_tokens: 300,
  });

  // Try to parse the response as JSON
  let iceBreakers: string[] = [];
  try {
    const text = completion.choices[0].message.content?.trim() || '';
    iceBreakers = JSON.parse(text);
  } catch {
    // fallback: return as a single string in an array
    iceBreakers = [completion.choices[0].message.content || ''];
  }

  res.status(200).json({ activities: iceBreakers });
} 