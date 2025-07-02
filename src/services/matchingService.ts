// NOTE: This is a simple matching algorithm for testing. In the future, make this more sophisticated (clustering, filtering, etc.).

// Define Profile type locally to avoid import issues
export interface Profile {
  id: string;
  name?: string;
  values: string[];
  goals: string[];
  preferences: string[];
  publicProfiles: Record<string, string>;
  communicationStyle?: string[];
  interests?: string[];
  connectionType?: string[];
  growthAreas?: string[];
  availability?: string[];
  location?: string;
  timezone?: string;
  identityTags?: string[];
}

export interface MatchOptions {
  minSharedValues?: number;
  minSharedGoals?: number;
  minSharedPreferences?: number;
  minSharedInterests?: number;
  minSharedCommunicationStyle?: number;
  minSharedConnectionType?: number;
  minSharedGrowthAreas?: number;
  minSharedAvailability?: number;
  minSharedIdentityTags?: number;
  groupSize?: 2 | 3; // 2 = pairs, 3 = groups of 3
}

// Synonym map for normalization
const SYNONYMS: Record<string, string> = {
  mentorship: 'mentor',
  mentor: 'mentor',
  mentee: 'mentee',
  collaboration: 'collaborate',
  collaborate: 'collaborate',
  friendship: 'friend',
  friend: 'friend',
  lgbtq: 'lgbtq+',
  'lgbtq+': 'lgbtq+',
  // Add more as needed
};

function normalizeArr(arr: string[] = []): string[] {
  return arr.map((v) => SYNONYMS[v.trim().toLowerCase()] || v.trim().toLowerCase()).filter(Boolean);
}

// Configurable complementary fields
const COMPLEMENTARY_FIELDS: Record<string, [string, string][]> = {
  connectionType: [
    ['mentor', 'mentee'],
    ['mentee', 'mentor'],
    // Add more complementary pairs as needed
  ],
  // Add more fields if needed
};

function countComplementary(arr1: string[] = [], arr2: string[] = [], field: string): number {
  const pairs = COMPLEMENTARY_FIELDS[field] || [];
  let count = 0;
  for (const [a, b] of pairs) {
    if (arr1.includes(a) && arr2.includes(b)) count++;
  }
  return count;
}

/**
 * Flexible matching function. Returns pairs or groups of profiles that meet the criteria.
 * All fields are optional; a match can occur in any area if the minimum is met.
 */
export function flexibleMatch(
  profiles: Profile[],
  options: MatchOptions = {}
): {
  group: Profile[];
  sharedValues: number;
  sharedGoals: number;
  sharedPreferences: number;
  sharedInterests: number;
  sharedCommunicationStyle: number;
  sharedConnectionType: number;
  sharedGrowthAreas: number;
  sharedAvailability: number;
  sharedIdentityTags: number;
  complementaryConnectionType: number;
}[] {
  const {
    minSharedValues = 1,
    minSharedGoals = 0,
    minSharedPreferences = 0,
    minSharedInterests = 0,
    minSharedCommunicationStyle = 0,
    minSharedConnectionType = 0,
    minSharedGrowthAreas = 0,
    minSharedAvailability = 0,
    minSharedIdentityTags = 0,
    groupSize = 2,
  } = options;
  const matches: {
    group: Profile[];
    sharedValues: number;
    sharedGoals: number;
    sharedPreferences: number;
    sharedInterests: number;
    sharedCommunicationStyle: number;
    sharedConnectionType: number;
    sharedGrowthAreas: number;
    sharedAvailability: number;
    sharedIdentityTags: number;
    complementaryConnectionType: number;
  }[] = [];

  // Normalize all profiles before matching
  const normProfiles = profiles.map((p) => ({
    ...p,
    values: normalizeArr(p.values),
    goals: normalizeArr(p.goals),
    preferences: normalizeArr(p.preferences),
    communicationStyle: normalizeArr(p.communicationStyle),
    interests: normalizeArr(p.interests),
    connectionType: normalizeArr(p.connectionType),
    growthAreas: normalizeArr(p.growthAreas),
    availability: normalizeArr(p.availability),
    identityTags: normalizeArr(p.identityTags),
  }));

  function countShared(arr1: string[] = [], arr2: string[] = []) {
    return arr1.filter((v) => arr2.includes(v)).length;
  }

  if (groupSize === 2) {
    for (let i = 0; i < normProfiles.length; i++) {
      for (let j = i + 1; j < normProfiles.length; j++) {
        const a = normProfiles[i];
        const b = normProfiles[j];
        const sharedValues = countShared(a.values, b.values);
        const sharedGoals = countShared(a.goals, b.goals);
        const sharedPreferences = countShared(a.preferences, b.preferences);
        const sharedInterests = countShared(a.interests, b.interests);
        const sharedCommunicationStyle = countShared(a.communicationStyle, b.communicationStyle);
        const sharedConnectionType = countShared(a.connectionType, b.connectionType);
        const sharedGrowthAreas = countShared(a.growthAreas, b.growthAreas);
        const sharedAvailability = countShared(a.availability, b.availability);
        const sharedIdentityTags = countShared(a.identityTags, b.identityTags);
        // Complementary logic (example: mentor/mentee)
        const complementaryConnectionType = countComplementary(a.connectionType, b.connectionType, 'connectionType') + countComplementary(b.connectionType, a.connectionType, 'connectionType');
        if (
          sharedValues >= minSharedValues ||
          sharedGoals >= minSharedGoals ||
          sharedPreferences >= minSharedPreferences ||
          sharedInterests >= minSharedInterests ||
          sharedCommunicationStyle >= minSharedCommunicationStyle ||
          sharedConnectionType >= minSharedConnectionType ||
          sharedGrowthAreas >= minSharedGrowthAreas ||
          sharedAvailability >= minSharedAvailability ||
          sharedIdentityTags >= minSharedIdentityTags ||
          complementaryConnectionType > 0
        ) {
          matches.push({
            group: [profiles[i], profiles[j]], // Return original profiles for display
            sharedValues,
            sharedGoals,
            sharedPreferences,
            sharedInterests,
            sharedCommunicationStyle,
            sharedConnectionType,
            sharedGrowthAreas,
            sharedAvailability,
            sharedIdentityTags,
            complementaryConnectionType,
          });
        }
      }
    }
  } else if (groupSize === 3) {
    // (For brevity, only implement complementary logic for pairs)
    for (let i = 0; i < normProfiles.length; i++) {
      for (let j = i + 1; j < normProfiles.length; j++) {
        for (let k = j + 1; k < normProfiles.length; k++) {
          const a = normProfiles[i];
          const b = normProfiles[j];
          const c = normProfiles[k];
          const sharedValues = countShared(a.values, b.values) + countShared(a.values, c.values) + countShared(b.values, c.values);
          const sharedGoals = countShared(a.goals, b.goals) + countShared(a.goals, c.goals) + countShared(b.goals, c.goals);
          const sharedPreferences = countShared(a.preferences, b.preferences) + countShared(a.preferences, c.preferences) + countShared(b.preferences, c.preferences);
          const sharedInterests = countShared(a.interests, b.interests) + countShared(a.interests, c.interests) + countShared(b.interests, c.interests);
          const sharedCommunicationStyle = countShared(a.communicationStyle, b.communicationStyle) + countShared(a.communicationStyle, c.communicationStyle) + countShared(b.communicationStyle, c.communicationStyle);
          const sharedConnectionType = countShared(a.connectionType, b.connectionType) + countShared(a.connectionType, c.connectionType) + countShared(b.connectionType, c.connectionType);
          const sharedGrowthAreas = countShared(a.growthAreas, b.growthAreas) + countShared(a.growthAreas, c.growthAreas) + countShared(b.growthAreas, c.growthAreas);
          const sharedAvailability = countShared(a.availability, b.availability) + countShared(a.availability, c.availability) + countShared(b.availability, c.availability);
          const sharedIdentityTags = countShared(a.identityTags, b.identityTags) + countShared(a.identityTags, c.identityTags) + countShared(b.identityTags, c.identityTags);
          if (
            sharedValues >= minSharedValues * 3 ||
            sharedGoals >= minSharedGoals * 3 ||
            sharedPreferences >= minSharedPreferences * 3 ||
            sharedInterests >= minSharedInterests * 3 ||
            sharedCommunicationStyle >= minSharedCommunicationStyle * 3 ||
            sharedConnectionType >= minSharedConnectionType * 3 ||
            sharedGrowthAreas >= minSharedGrowthAreas * 3 ||
            sharedAvailability >= minSharedAvailability * 3 ||
            sharedIdentityTags >= minSharedIdentityTags * 3
          ) {
            matches.push({
              group: [profiles[i], profiles[j], profiles[k]],
              sharedValues,
              sharedGoals,
              sharedPreferences,
              sharedInterests,
              sharedCommunicationStyle,
              sharedConnectionType,
              sharedGrowthAreas,
              sharedAvailability,
              sharedIdentityTags,
              complementaryConnectionType: 0, // Not calculated for groups
            });
          }
        }
      }
    }
  }
  // Sort by most shared values, then goals, then preferences, then interests, etc., then complementary
  matches.sort((a, b) =>
    b.sharedValues - a.sharedValues ||
    b.sharedGoals - a.sharedGoals ||
    b.sharedPreferences - a.sharedPreferences ||
    b.sharedInterests - a.sharedInterests ||
    b.sharedCommunicationStyle - a.sharedCommunicationStyle ||
    b.sharedConnectionType - a.sharedConnectionType ||
    b.sharedGrowthAreas - a.sharedGrowthAreas ||
    b.sharedAvailability - a.sharedAvailability ||
    b.sharedIdentityTags - a.sharedIdentityTags ||
    b.complementaryConnectionType - a.complementaryConnectionType
  );
  return matches;
}

// TODO: Add clustering, AI-based matching, and more advanced logic in the future.

import { generateResponse } from './openaiService';

export interface UserProfile {
  id: string;
  name: string;
  values: {
    coreValues: string[];
    personalGoals: string[];
    preferredCommunication: string[];
    availability: {
      timezone: string;
      preferredTimes: string[];
    };
  };
  bio: string;
}

export interface Match {
  id: string;
  userIds: string[];
  matchScore: number;
  compatibilityFactors: {
    valuesAlignment: number;
    goalsAlignment: number;
    communicationStyle: number;
  };
  matchReason: string;
  createdAt: Date;
  status: string;
}

export interface CompatibilityScore {
  overallScore: number;
  valuesAlignment: number;
  goalsAlignment: number;
  communicationStyle: number;
  availabilityMatch: number;
  interestsOverlap: number;
}

export function calculateCompatibilityScore(
  user1: UserProfile,
  user2: UserProfile
): CompatibilityScore {
  // Values alignment (40% weight)
  const valuesAlignment = calculateValuesAlignment(user1.values.coreValues, user2.values.coreValues);
  // Goals alignment (25% weight)
  const goalsAlignment = calculateGoalsAlignment(user1.values.personalGoals, user2.values.personalGoals);
  // Communication style (20% weight)
  const communicationStyle = calculateCommunicationAlignment(
    user1.values.preferredCommunication,
    user2.values.preferredCommunication
  );
  // Availability match (10% weight)
  const availabilityMatch = calculateAvailabilityMatch(
    user1.values.availability,
    user2.values.availability
  );
  // Interests overlap (5% weight) - based on bio analysis
  const interestsOverlap = calculateInterestsOverlap(user1.bio, user2.bio);
  // Calculate weighted overall score
  const overallScore = Math.round(
    valuesAlignment * 0.4 +
    goalsAlignment * 0.25 +
    communicationStyle * 0.2 +
    availabilityMatch * 0.1 +
    interestsOverlap * 0.05
  );
  return {
    overallScore,
    valuesAlignment,
    goalsAlignment,
    communicationStyle,
    availabilityMatch,
    interestsOverlap,
  };
}

function calculateValuesAlignment(values1: string[], values2: string[]): number {
  const commonValues = values1.filter(value => values2.includes(value));
  const totalValues = Math.max(values1.length, values2.length);
  return totalValues > 0 ? (commonValues.length / totalValues) * 100 : 0;
}

function calculateGoalsAlignment(goals1: string[], goals2: string[]): number {
  const commonGoals = goals1.filter(goal => goals2.includes(goal));
  const totalGoals = Math.max(goals1.length, goals2.length);
  return totalGoals > 0 ? (commonGoals.length / totalGoals) * 100 : 0;
}

function calculateCommunicationAlignment(comm1: string[], comm2: string[]): number {
  const commonMethods = comm1.filter(method => comm2.includes(method));
  const totalMethods = Math.max(comm1.length, comm2.length);
  return totalMethods > 0 ? (commonMethods.length / totalMethods) * 100 : 0;
}

function calculateAvailabilityMatch(avail1: { timezone: string; preferredTimes: string[] }, avail2: { timezone: string; preferredTimes: string[] }): number {
  // Check timezone compatibility
  const timezoneMatch = avail1.timezone === avail2.timezone ? 100 : 50;
  // Check overlapping preferred times
  const commonTimes = avail1.preferredTimes.filter((time: string) => 
    avail2.preferredTimes.includes(time)
  );
  const timeOverlap = avail1.preferredTimes.length > 0 ? 
    (commonTimes.length / Math.max(avail1.preferredTimes.length, avail2.preferredTimes.length)) * 100 : 0;
  return (timezoneMatch + timeOverlap) / 2;
}

function calculateInterestsOverlap(bio1: string, bio2: string): number {
  // Simple keyword-based overlap calculation
  const words1 = bio1.toLowerCase().split(/\s+/);
  const words2 = bio2.toLowerCase().split(/\s+/);
  const commonWords = words1.filter(word => 
    words2.includes(word) && word.length > 3
  );
  const totalWords = Math.max(words1.length, words2.length);
  return totalWords > 0 ? (commonWords.length / totalWords) * 100 : 0;
}

export async function generateMatches(
  userProfile: UserProfile,
  potentialMatches: UserProfile[],
  maxMatches: number = 5
): Promise<Match[]> {
  const matches: Match[] = [];
  for (const potentialMatch of potentialMatches) {
    if (potentialMatch.id === userProfile.id) continue;
    // Calculate compatibility score using our enhanced algorithm
    const compatibility = calculateCompatibilityScore(userProfile, potentialMatch);
    // Only include matches with significant compatibility (70%+)
    if (compatibility.overallScore >= 70) {
      // Generate AI-powered match reason
      const matchReason = await generateMatchReason(userProfile, potentialMatch, compatibility);
      matches.push({
        id: `${userProfile.id}-${potentialMatch.id}`,
        userIds: [userProfile.id, potentialMatch.id],
        matchScore: compatibility.overallScore,
        compatibilityFactors: {
          valuesAlignment: compatibility.valuesAlignment,
          goalsAlignment: compatibility.goalsAlignment,
          communicationStyle: compatibility.communicationStyle,
        },
        matchReason,
        createdAt: new Date(),
        status: 'pending',
      });
    }
    if (matches.length >= maxMatches) break;
  }
  // Sort matches by score (highest first)
  return matches.sort((a, b) => b.matchScore - a.matchScore);
}

async function generateMatchReason(
  user1: UserProfile,
  user2: UserProfile,
  compatibility: CompatibilityScore
): Promise<string> {
  const prompt = `
    Analyze the compatibility between these users and provide a compelling reason for connection:
    
    User 1 (${user1.name}):
    - Core Values: ${user1.values.coreValues.join(', ')}
    - Personal Goals: ${user1.values.personalGoals.join(', ')}
    - Communication Preferences: ${user1.values.preferredCommunication.join(', ')}
    - Bio: ${user1.bio}
    
    User 2 (${user2.name}):
    - Core Values: ${user2.values.coreValues.join(', ')}
    - Personal Goals: ${user2.values.personalGoals.join(', ')}
    - Communication Preferences: ${user2.values.preferredCommunication.join(', ')}
    - Bio: ${user2.bio}
    
    Compatibility Scores:
    - Overall: ${compatibility.overallScore}%
    - Values Alignment: ${compatibility.valuesAlignment}%
    - Goals Alignment: ${compatibility.goalsAlignment}%
    - Communication Style: ${compatibility.communicationStyle}%
    
    Provide a concise, engaging reason (2-3 sentences) explaining why these users would connect well, focusing on their strongest alignment areas.
  `;
  try {
    const response = await generateResponse(prompt);
    return response || 'Strong compatibility based on shared values and goals';
  } catch (error) {
    console.error('Error generating match reason:', error);
    return 'Strong compatibility based on shared values and goals';
  }
} 