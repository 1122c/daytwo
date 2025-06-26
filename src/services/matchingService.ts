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
  }[] = [];

  // Helper to count shared items
  function countShared(arr1: string[] = [], arr2: string[] = []) {
    return arr1.filter((v) => arr2.includes(v)).length;
  }

  // Pairwise or groupwise matching
  if (groupSize === 2) {
    for (let i = 0; i < profiles.length; i++) {
      for (let j = i + 1; j < profiles.length; j++) {
        const sharedValues = countShared(profiles[i].values, profiles[j].values);
        const sharedGoals = countShared(profiles[i].goals, profiles[j].goals);
        const sharedPreferences = countShared(profiles[i].preferences, profiles[j].preferences);
        const sharedInterests = countShared(profiles[i].interests, profiles[j].interests);
        const sharedCommunicationStyle = countShared(profiles[i].communicationStyle, profiles[j].communicationStyle);
        const sharedConnectionType = countShared(profiles[i].connectionType, profiles[j].connectionType);
        const sharedGrowthAreas = countShared(profiles[i].growthAreas, profiles[j].growthAreas);
        const sharedAvailability = countShared(profiles[i].availability, profiles[j].availability);
        const sharedIdentityTags = countShared(profiles[i].identityTags, profiles[j].identityTags);
        // Only require that at least one of the criteria is met
        if (
          (sharedValues >= minSharedValues ||
            sharedGoals >= minSharedGoals ||
            sharedPreferences >= minSharedPreferences ||
            sharedInterests >= minSharedInterests ||
            sharedCommunicationStyle >= minSharedCommunicationStyle ||
            sharedConnectionType >= minSharedConnectionType ||
            sharedGrowthAreas >= minSharedGrowthAreas ||
            sharedAvailability >= minSharedAvailability ||
            sharedIdentityTags >= minSharedIdentityTags)
        ) {
          matches.push({
            group: [profiles[i], profiles[j]],
            sharedValues,
            sharedGoals,
            sharedPreferences,
            sharedInterests,
            sharedCommunicationStyle,
            sharedConnectionType,
            sharedGrowthAreas,
            sharedAvailability,
            sharedIdentityTags,
          });
        }
      }
    }
  } else if (groupSize === 3) {
    for (let i = 0; i < profiles.length; i++) {
      for (let j = i + 1; j < profiles.length; j++) {
        for (let k = j + 1; k < profiles.length; k++) {
          const sharedValues =
            countShared(profiles[i].values, profiles[j].values) +
            countShared(profiles[i].values, profiles[k].values) +
            countShared(profiles[j].values, profiles[k].values);
          const sharedGoals =
            countShared(profiles[i].goals, profiles[j].goals) +
            countShared(profiles[i].goals, profiles[k].goals) +
            countShared(profiles[j].goals, profiles[k].goals);
          const sharedPreferences =
            countShared(profiles[i].preferences, profiles[j].preferences) +
            countShared(profiles[i].preferences, profiles[k].preferences) +
            countShared(profiles[j].preferences, profiles[k].preferences);
          const sharedInterests =
            countShared(profiles[i].interests, profiles[j].interests) +
            countShared(profiles[i].interests, profiles[k].interests) +
            countShared(profiles[j].interests, profiles[k].interests);
          const sharedCommunicationStyle =
            countShared(profiles[i].communicationStyle, profiles[j].communicationStyle) +
            countShared(profiles[i].communicationStyle, profiles[k].communicationStyle) +
            countShared(profiles[j].communicationStyle, profiles[k].communicationStyle);
          const sharedConnectionType =
            countShared(profiles[i].connectionType, profiles[j].connectionType) +
            countShared(profiles[i].connectionType, profiles[k].connectionType) +
            countShared(profiles[j].connectionType, profiles[k].connectionType);
          const sharedGrowthAreas =
            countShared(profiles[i].growthAreas, profiles[j].growthAreas) +
            countShared(profiles[i].growthAreas, profiles[k].growthAreas) +
            countShared(profiles[j].growthAreas, profiles[k].growthAreas);
          const sharedAvailability =
            countShared(profiles[i].availability, profiles[j].availability) +
            countShared(profiles[i].availability, profiles[k].availability) +
            countShared(profiles[j].availability, profiles[k].availability);
          const sharedIdentityTags =
            countShared(profiles[i].identityTags, profiles[j].identityTags) +
            countShared(profiles[i].identityTags, profiles[k].identityTags) +
            countShared(profiles[j].identityTags, profiles[k].identityTags);
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
            });
          }
        }
      }
    }
  }
  // Sort by most shared values, then goals, then preferences, then interests, etc.
  matches.sort((a, b) =>
    b.sharedValues - a.sharedValues ||
    b.sharedGoals - a.sharedGoals ||
    b.sharedPreferences - a.sharedPreferences ||
    b.sharedInterests - a.sharedInterests ||
    b.sharedCommunicationStyle - a.sharedCommunicationStyle ||
    b.sharedConnectionType - a.sharedConnectionType ||
    b.sharedGrowthAreas - a.sharedGrowthAreas ||
    b.sharedAvailability - a.sharedAvailability ||
    b.sharedIdentityTags - a.sharedIdentityTags
  );
  return matches;
}

// TODO: Add clustering, AI-based matching, and more advanced logic in the future. 