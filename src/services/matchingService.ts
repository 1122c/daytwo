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