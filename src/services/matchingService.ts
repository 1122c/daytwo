// NOTE: This is a simple matching algorithm for testing. In the future, make this more sophisticated (clustering, filtering, etc.).
import type { Profile } from '@/app/discover/page';

// Returns an array of pairs with a basic shared values count
export function simpleMatch(profiles: Profile[]): { pair: [Profile, Profile], sharedValues: number }[] {
  const matches: { pair: [Profile, Profile], sharedValues: number }[] = [];
  for (let i = 0; i < profiles.length; i++) {
    for (let j = i + 1; j < profiles.length; j++) {
      const shared = profiles[i].values.filter(v => profiles[j].values.includes(v)).length;
      matches.push({ pair: [profiles[i], profiles[j]], sharedValues: shared });
    }
  }
  // Sort by most shared values
  matches.sort((a, b) => b.sharedValues - a.sharedValues);
  return matches;
} 