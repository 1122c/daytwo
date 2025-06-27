"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { auth, db } from '@/services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [authUser, setAuthUser] = useState<User | null | undefined>(undefined);
  const [profile, setProfile] = useState({
    name: '',
    values: '',
    goals: '',
    preferences: '',
    communicationStyle: '',
    interests: '',
    connectionType: '',
    growthAreas: '',
    availability: '',
    location: '',
    timezone: '',
    identityTags: '',
    publicProfiles: {
      linkedin: '',
      twitter: '',
      instagram: '',
      tiktok: '',
      onlyfans: '',
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Auth check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      if (!user) {
        router.replace('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Fetch profile
  useEffect(() => {
    async function fetchProfile(uid: string) {
      setLoading(true);
      setError('');
      setSuccess(false);
      try {
        const docRef = doc(db, 'profiles', uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile({
            name: data.name || '',
            values: Array.isArray(data.values) ? data.values.join(', ') : data.values || '',
            goals: Array.isArray(data.goals) ? data.goals.join(', ') : data.goals || '',
            preferences: Array.isArray(data.preferences) ? data.preferences.join(', ') : data.preferences || '',
            communicationStyle: Array.isArray(data.communicationStyle) ? data.communicationStyle.join(', ') : data.communicationStyle || '',
            interests: Array.isArray(data.interests) ? data.interests.join(', ') : data.interests || '',
            connectionType: Array.isArray(data.connectionType) ? data.connectionType.join(', ') : data.connectionType || '',
            growthAreas: Array.isArray(data.growthAreas) ? data.growthAreas.join(', ') : data.growthAreas || '',
            availability: Array.isArray(data.availability) ? data.availability.join(', ') : data.availability || '',
            location: data.location || '',
            timezone: data.timezone || '',
            identityTags: Array.isArray(data.identityTags) ? data.identityTags.join(', ') : data.identityTags || '',
            publicProfiles: {
              linkedin: data.publicProfiles?.linkedin || '',
              twitter: data.publicProfiles?.twitter || '',
              instagram: data.publicProfiles?.instagram || '',
              tiktok: data.publicProfiles?.tiktok || '',
              onlyfans: data.publicProfiles?.onlyfans || '',
            },
          });
        }
      } catch {
        setError('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    }
    if (authUser && authUser.uid) {
      fetchProfile(authUser.uid);
    }
  }, [authUser]);

  // Example chips for each field
  const EXAMPLES = {
    values: ["empathy", "growth", "curiosity", "integrity", "creativity", "community"],
    goals: ["find a mentor", "make friends", "collaborate on projects", "expand network"],
    preferences: ["small group", "remote", "in-person", "one-on-one"],
    communicationStyle: ["direct", "reflective", "supportive", "analytical"],
    interests: ["art", "tech", "outdoors", "music", "volunteering"],
    connectionType: ["mentorship", "collaboration", "friendship", "accountability partner"],
    growthAreas: ["leadership", "emotional intelligence", "public speaking"],
    availability: ["weekdays", "evenings", "weekends", "flexible"],
    identityTags: ["lgbtq+", "women in tech", "bipoc"],
  };

  function addChip(
    setter: (value: string) => void,
    value: string,
    current: string
  ) {
    const arr = current.split(",").map((v: string) => v.trim().toLowerCase()).filter(Boolean);
    if (!arr.includes(value)) {
      setter(current ? current + ", " + value : value);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!authUser) return;
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      await setDoc(doc(db, 'profiles', authUser.uid), {
        name: profile.name,
        values: profile.values ? profile.values.split(',').map((v) => v.trim().toLowerCase()).filter(Boolean) : [],
        goals: profile.goals ? profile.goals.split(',').map((g) => g.trim().toLowerCase()).filter(Boolean) : [],
        preferences: profile.preferences ? profile.preferences.split(',').map((p) => p.trim().toLowerCase()).filter(Boolean) : [],
        communicationStyle: profile.communicationStyle ? profile.communicationStyle.split(',').map((c) => c.trim().toLowerCase()).filter(Boolean) : [],
        interests: profile.interests ? profile.interests.split(',').map((i) => i.trim().toLowerCase()).filter(Boolean) : [],
        connectionType: profile.connectionType ? profile.connectionType.split(',').map((c) => c.trim().toLowerCase()).filter(Boolean) : [],
        growthAreas: profile.growthAreas ? profile.growthAreas.split(',').map((g) => g.trim().toLowerCase()).filter(Boolean) : [],
        availability: profile.availability ? profile.availability.split(',').map((a) => a.trim().toLowerCase()).filter(Boolean) : [],
        location: profile.location ? profile.location.trim() : '',
        timezone: profile.timezone ? profile.timezone.trim() : '',
        identityTags: profile.identityTags ? profile.identityTags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean) : [],
        publicProfiles: profile.publicProfiles,
        uid: authUser.uid,
        updatedAt: new Date(),
      }, { merge: true });
      setSuccess(true);
    } catch {
      setError('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  if (authUser === undefined || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 text-lg">Loading...</div>
      </div>
    );
  }

  if (!authUser) {
    // Redirect handled in useEffect
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <nav className="w-full max-w-xl mx-auto mb-8 flex justify-between">
        <Link href="/">
          <span className="text-blue-600 hover:underline font-medium">Onboarding</span>
        </Link>
        <Link href="/discover">
          <span className="text-blue-600 hover:underline font-medium">Discover Profiles</span>
        </Link>
      </nav>
      <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-8 flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-4">Your Profile</h1>
        {error && <div className="mb-2 text-red-600">{error}</div>}
        {success && <div className="mb-2 text-green-600">Profile updated!</div>}
        <form className="w-full" onSubmit={handleSubmit}>
          <label className="block mb-2 font-semibold">Name</label>
          <input
            className="w-full border rounded p-2 mb-4"
            type="text"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            placeholder="e.g. Alice Smith"
          />
          <label className="block mb-2 font-semibold">Values (comma separated)</label>
          <div className="text-xs text-gray-500 mb-1">e.g. what matters most to you in relationships and life?</div>
          <div className="flex flex-wrap gap-2 mb-2">
            {EXAMPLES.values.map((ex) => (
              <button type="button" key={ex} className="px-2 py-1 bg-gray-200 rounded text-xs" onClick={() => addChip((v) => setProfile(prev => ({ ...prev, values: v })), ex, profile.values)}>{ex}</button>
            ))}
          </div>
          <input
            className="w-full border rounded p-2 mb-4"
            type="text"
            value={profile.values}
            onChange={(e) => setProfile({ ...profile, values: e.target.value })}
            placeholder="e.g. empathy, growth, curiosity"
            spellCheck={true}
          />
          <label className="block mb-2 font-semibold">Goals (comma separated)</label>
          <div className="text-xs text-gray-500 mb-1">e.g. what do you hope to get out of this platform?</div>
          <div className="flex flex-wrap gap-2 mb-2">
            {EXAMPLES.goals.map((ex) => (
              <button type="button" key={ex} className="px-2 py-1 bg-gray-200 rounded text-xs" onClick={() => addChip((v) => setProfile(prev => ({ ...prev, goals: v })), ex, profile.goals)}>{ex}</button>
            ))}
          </div>
          <input
            className="w-full border rounded p-2 mb-4"
            type="text"
            value={profile.goals}
            onChange={(e) => setProfile({ ...profile, goals: e.target.value })}
            placeholder="e.g. find a mentor, make friends"
            spellCheck={true}
          />
          <label className="block mb-2 font-semibold">Preferences (comma separated, optional)</label>
          <div className="text-xs text-gray-500 mb-1">e.g. how do you prefer to connect?</div>
          <div className="flex flex-wrap gap-2 mb-2">
            {EXAMPLES.preferences.map((ex) => (
              <button type="button" key={ex} className="px-2 py-1 bg-gray-200 rounded text-xs" onClick={() => addChip((v) => setProfile(prev => ({ ...prev, preferences: v })), ex, profile.preferences)}>{ex}</button>
            ))}
          </div>
          <input
            className="w-full border rounded p-2 mb-4"
            type="text"
            value={profile.preferences}
            onChange={(e) => setProfile({ ...profile, preferences: e.target.value })}
            placeholder="e.g. small group, remote, in-person"
            spellCheck={true}
          />
          <label className="block mb-2 font-semibold">Communication Style (comma separated, optional)</label>
          <div className="text-xs text-gray-500 mb-1">e.g. how do you like to communicate?</div>
          <div className="flex flex-wrap gap-2 mb-2">
            {EXAMPLES.communicationStyle.map((ex) => (
              <button type="button" key={ex} className="px-2 py-1 bg-gray-200 rounded text-xs" onClick={() => addChip((v) => setProfile(prev => ({ ...prev, communicationStyle: v })), ex, profile.communicationStyle)}>{ex}</button>
            ))}
          </div>
          <input
            className="w-full border rounded p-2 mb-4"
            type="text"
            value={profile.communicationStyle}
            onChange={(e) => setProfile({ ...profile, communicationStyle: e.target.value })}
            placeholder="e.g. direct, reflective, supportive, analytical"
            spellCheck={true}
          />
          <label className="block mb-2 font-semibold">Interests (comma separated, optional)</label>
          <div className="text-xs text-gray-500 mb-1">e.g. what are you passionate about?</div>
          <div className="flex flex-wrap gap-2 mb-2">
            {EXAMPLES.interests.map((ex) => (
              <button type="button" key={ex} className="px-2 py-1 bg-gray-200 rounded text-xs" onClick={() => addChip((v) => setProfile(prev => ({ ...prev, interests: v })), ex, profile.interests)}>{ex}</button>
            ))}
          </div>
          <input
            className="w-full border rounded p-2 mb-4"
            type="text"
            value={profile.interests}
            onChange={(e) => setProfile({ ...profile, interests: e.target.value })}
            placeholder="e.g. art, tech, outdoors, music, volunteering"
            spellCheck={true}
          />
          <label className="block mb-2 font-semibold">Connection Type (comma separated, optional)</label>
          <div className="text-xs text-gray-500 mb-1">e.g. what kind of connection are you seeking?</div>
          <div className="flex flex-wrap gap-2 mb-2">
            {EXAMPLES.connectionType.map((ex) => (
              <button type="button" key={ex} className="px-2 py-1 bg-gray-200 rounded text-xs" onClick={() => addChip((v) => setProfile(prev => ({ ...prev, connectionType: v })), ex, profile.connectionType)}>{ex}</button>
            ))}
          </div>
          <input
            className="w-full border rounded p-2 mb-4"
            type="text"
            value={profile.connectionType}
            onChange={(e) => setProfile({ ...profile, connectionType: e.target.value })}
            placeholder="e.g. mentorship, collaboration, friendship, accountability partner"
            spellCheck={true}
          />
          <label className="block mb-2 font-semibold">Growth Areas (comma separated, optional)</label>
          <div className="text-xs text-gray-500 mb-1">e.g. what do you want to work on or improve?</div>
          <div className="flex flex-wrap gap-2 mb-2">
            {EXAMPLES.growthAreas.map((ex) => (
              <button type="button" key={ex} className="px-2 py-1 bg-gray-200 rounded text-xs" onClick={() => addChip((v) => setProfile(prev => ({ ...prev, growthAreas: v })), ex, profile.growthAreas)}>{ex}</button>
            ))}
          </div>
          <input
            className="w-full border rounded p-2 mb-4"
            type="text"
            value={profile.growthAreas}
            onChange={(e) => setProfile({ ...profile, growthAreas: e.target.value })}
            placeholder="e.g. leadership, emotional intelligence, public speaking"
            spellCheck={true}
          />
          <label className="block mb-2 font-semibold">Availability (comma separated, optional)</label>
          <div className="text-xs text-gray-500 mb-1">e.g. when are you usually available to connect?</div>
          <div className="flex flex-wrap gap-2 mb-2">
            {EXAMPLES.availability.map((ex) => (
              <button type="button" key={ex} className="px-2 py-1 bg-gray-200 rounded text-xs" onClick={() => addChip((v) => setProfile(prev => ({ ...prev, availability: v })), ex, profile.availability)}>{ex}</button>
            ))}
          </div>
          <input
            className="w-full border rounded p-2 mb-4"
            type="text"
            value={profile.availability}
            onChange={(e) => setProfile({ ...profile, availability: e.target.value })}
            placeholder="e.g. weekdays, evenings, weekends, flexible"
            spellCheck={true}
          />
          <label className="block mb-2 font-semibold">Identity Tags (comma separated, optional)</label>
          <div className="text-xs text-gray-500 mb-1">e.g. communities or identities you want to connect around</div>
          <div className="flex flex-wrap gap-2 mb-2">
            {EXAMPLES.identityTags.map((ex) => (
              <button type="button" key={ex} className="px-2 py-1 bg-gray-200 rounded text-xs" onClick={() => addChip((v) => setProfile(prev => ({ ...prev, identityTags: v })), ex, profile.identityTags)}>{ex}</button>
            ))}
          </div>
          <input
            className="w-full border rounded p-2 mb-4"
            type="text"
            value={profile.identityTags}
            onChange={(e) => setProfile({ ...profile, identityTags: e.target.value })}
            placeholder="e.g. LGBTQ+, Women in Tech, BIPOC"
            spellCheck={true}
          />
          <label className="block mb-2 font-semibold">Public Profiles</label>
          <input
            className="w-full border rounded p-2 mb-2"
            type="url"
            placeholder="LinkedIn URL"
            value={profile.publicProfiles.linkedin}
            onChange={(e) => setProfile({ ...profile, publicProfiles: { ...profile.publicProfiles, linkedin: e.target.value } })}
          />
          <input
            className="w-full border rounded p-2 mb-2"
            type="url"
            placeholder="Twitter URL"
            value={profile.publicProfiles.twitter}
            onChange={(e) => setProfile({ ...profile, publicProfiles: { ...profile.publicProfiles, twitter: e.target.value } })}
          />
          <input
            className="w-full border rounded p-2 mb-2"
            type="url"
            placeholder="Instagram URL"
            value={profile.publicProfiles.instagram}
            onChange={(e) => setProfile({ ...profile, publicProfiles: { ...profile.publicProfiles, instagram: e.target.value } })}
          />
          <input
            className="w-full border rounded p-2 mb-2"
            type="url"
            placeholder="TikTok URL"
            value={profile.publicProfiles.tiktok}
            onChange={(e) => setProfile({ ...profile, publicProfiles: { ...profile.publicProfiles, tiktok: e.target.value } })}
          />
          <input
            className="w-full border rounded p-2 mb-4"
            type="url"
            placeholder="OnlyFans URL"
            value={profile.publicProfiles.onlyfans}
            onChange={(e) => setProfile({ ...profile, publicProfiles: { ...profile.publicProfiles, onlyfans: e.target.value } })}
          />
          <button
            type="submit"
            className="w-full bg-green-500 text-white py-2 rounded"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
} 