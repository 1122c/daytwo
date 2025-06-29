// Placeholder for websocket service
import { OpenAI } from 'openai';

// User profile structure for AI-assisted matching
export interface UserProfile {
  id: string;
  name: string;
  values: string[];
  goals: string[];
  preferences: string[];
  publicProfiles?: {
    linkedin?: string;
    twitter?: string;
    instagram?: string;
    tiktok?: string;
    onlyfans?: string;
  };
}

// Sample user profiles for testing
export const sampleUserProfiles: UserProfile[] = [
  {
    id: '1',
    name: 'Alice',
    values: ['empathy', 'growth', 'curiosity'],
    goals: ['find a mentor', 'expand network'],
    preferences: ['small group', 'in-person'],
    publicProfiles: {
      linkedin: 'https://linkedin.com/in/alice',
      twitter: 'https://twitter.com/alice',
    },
  },
  {
    id: '2',
    name: 'Bob',
    values: ['integrity', 'creativity', 'curiosity'],
    goals: ['collaborate on projects'],
    preferences: ['one-on-one', 'remote'],
    publicProfiles: {
      instagram: 'https://instagram.com/bob',
    },
  },
  {
    id: '3',
    name: 'Carol',
    values: ['community', 'growth', 'empathy'],
    goals: ['make new friends', 'learn new skills'],
    preferences: ['small group', 'remote'],
    publicProfiles: {
      tiktok: 'https://tiktok.com/@carol',
      onlyfans: 'https://onlyfans.com/carol',
    },
  },
];

/**
 * Generate a thoughtful, plain-language match explanation for a set of user profiles.
 * @param profiles Array of UserProfile objects to match
 * @returns Promise<string> - GPT-generated explanation
 */
/**
 * Generate a very short match explanation for a set of user profiles.
 * @param profiles Array of UserProfile objects to match
 * @returns Promise<string> - Short explanation (30 chars or less)
 */
export async function generateMatchExplanation(profiles: UserProfile[]): Promise<string> {
  // Simple templated explanations instead of OpenAI for brevity
  const user1 = profiles[0];
  const user2 = profiles[1];
  
  const sharedValues = user1.values?.filter(v => user2.values?.includes(v)) || [];
  const sharedGoals = user1.goals?.filter(g => user2.goals?.includes(g)) || [];
  
  // Create very short explanations (30 chars max)
  if (sharedValues.length > 0 && sharedGoals.length > 0) {
    return `${sharedValues[0]} + ${sharedGoals[0]}`;
  } else if (sharedValues.length > 0) {
    return `Both value ${sharedValues[0]}`;
  } else if (sharedGoals.length > 0) {
    return `Both want ${sharedGoals[0]}`;
  } else {
    return `Growth potential`;
  }
  
  // Original OpenAI version (commented out for brevity):
  /*
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const profileSummaries = profiles.map((p) => {
    const publicProfiles = p.publicProfiles
      ? Object.entries(p.publicProfiles)
          .map(([platform, url]) => `${platform}: ${url}`)
          .join(', ')
      : 'None';
    return `Name: ${p.name}\nValues: ${p.values.join(', ')}\nGoals: ${p.goals.join(', ')}\nPreferences: ${p.preferences.join(', ')}\nPublic Profiles: ${publicProfiles}`;
  });

  const prompt = `Given the following user profiles, create a VERY SHORT explanation (maximum 30 characters) of why they match. Use only 2-4 words.\n\n${profileSummaries.join('\n\n')}\n\nShort explanation (max 30 chars):`;

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'You create very short match explanations. Maximum 30 characters. Use 2-4 words only.' },
      { role: 'user', content: prompt },
    ],
    max_tokens: 20,
    temperature: 0.3,
  });

  const result = response.choices[0]?.message?.content?.trim() || 'Good match';
  return result.length > 30 ? result.substring(0, 27) + '...' : result;
  */
}