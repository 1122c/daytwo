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
export async function generateMatchExplanation(profiles: UserProfile[]): Promise<string> {
  // Initialize OpenAI client here, after env vars are loaded
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

  const prompt = `Given the following user profiles, explain why they would make a thoughtful, intentional match. Focus on compatibility, values alignment, and potential growth areas.\n\n${profileSummaries.join('\n\n')}\n\nExplanation:`;

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'You are an expert in human-centered relationship building.' },
      { role: 'user', content: prompt },
    ],
    max_tokens: 200,
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content?.trim() || 'No explanation generated.';
}