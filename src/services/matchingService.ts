// NOTE: This is a simple matching algorithm for testing. In the future, make this more sophisticated (clustering, filtering, etc.).

// Define Profile type locally to avoid import issues
export interface Profile {
  id: string;
  name?: string;
  values: string[];
  goals: string[];
  preferences: string[];
  publicProfiles: Record<string, string>;
}

export interface MatchOptions {
  minSharedValues?: number;
  minSharedGoals?: number;
  minSharedPreferences?: number;
  groupSize?: 2 | 3; // 2 = pairs, 3 = groups of 3
}

/**
 * Flexible matching function. Returns pairs or groups of profiles that meet the criteria.
 * @param profiles Array of user profiles
 * @param options Matching options (min shared values/goals/preferences, group size)
 */
export function flexibleMatch(
  profiles: Profile[],
  options: MatchOptions = {}
): { group: Profile[]; sharedValues: number; sharedGoals: number; sharedPreferences: number }[] {
  const {
    minSharedValues = 1,
    minSharedGoals = 0,
    minSharedPreferences = 0,
    groupSize = 2,
  } = options;
  const matches: { group: Profile[]; sharedValues: number; sharedGoals: number; sharedPreferences: number }[] = [];

  // Helper to count shared items
  function countShared(arr1: string[], arr2: string[]) {
    return arr1.filter((v) => arr2.includes(v)).length;
  }

  // Pairwise or groupwise matching
  if (groupSize === 2) {
    for (let i = 0; i < profiles.length; i++) {
      for (let j = i + 1; j < profiles.length; j++) {
        const sharedValues = countShared(profiles[i].values, profiles[j].values);
        const sharedGoals = countShared(profiles[i].goals, profiles[j].goals);
        const sharedPreferences = countShared(profiles[i].preferences, profiles[j].preferences);
        if (
          sharedValues >= minSharedValues &&
          sharedGoals >= minSharedGoals &&
          sharedPreferences >= minSharedPreferences
        ) {
          matches.push({
            group: [profiles[i], profiles[j]],
            sharedValues,
            sharedGoals,
            sharedPreferences,
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
          if (
            sharedValues >= minSharedValues * 3 &&
            sharedGoals >= minSharedGoals * 3 &&
            sharedPreferences >= minSharedPreferences * 3
          ) {
            matches.push({
              group: [profiles[i], profiles[j], profiles[k]],
              sharedValues,
              sharedGoals,
              sharedPreferences,
            });
          }
        }
      }
    }
  }
  // Sort by most shared values, then goals, then preferences
  matches.sort((a, b) =>
    b.sharedValues - a.sharedValues || b.sharedGoals - a.sharedGoals || b.sharedPreferences - a.sharedPreferences
  );
  return matches;
}

// TODO: Add clustering, AI-based matching, and more advanced logic in the future. 