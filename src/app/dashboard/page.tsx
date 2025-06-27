"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { auth, db, storage } from '@/services/firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import React from 'react';
import type { UserProfile } from '@/services/websocketService';

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
    } as UserProfile['publicProfiles'],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);
  const [picUploading, setPicUploading] = useState(false);
  const [promptLoading, setPromptLoading] = useState(false);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [promptError, setPromptError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Auth check with improved logic
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setAuthChecked(true);
      
      // Only redirect if we're sure there's no user and auth check is complete
      if (!user && authChecked) {
        console.log('No user found, redirecting to login');
        router.push('/login');
      }
    });
    
    return () => unsubscribe();
  }, [router, authChecked]);

  // Fetch profile - only run when we have a confirmed user
  useEffect(() => {
    async function fetchProfile(uid: string) {
      setLoading(true);
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
        } else {
          console.log('No profile found for user, showing empty form');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    }
    
    // Only fetch profile if we have a confirmed authenticated user
    if (authUser && authUser.uid && authChecked) {
      fetchProfile(authUser.uid);
    } else if (authChecked && !authUser) {
      setLoading(false);
    }
  }, [authUser, authChecked]);

  // Fetch profile picture if exists
  useEffect(() => {
    async function fetchProfilePic() {
      if (authUser?.uid) {
        try {
          const url = await getDownloadURL(ref(storage, `profile-pictures/${authUser.uid}`));
          setProfilePicUrl(url);
        } catch {
          setProfilePicUrl(null);
        }
      }
    }
    fetchProfilePic();
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
    if (!authUser) {
      return;
    }
    
    setSaving(true);
    
    try {
      console.log('Saving profile for user:', authUser.uid);
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
      
      console.log('Profile saved successfully');
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handlePicUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!authUser || !e.target.files?.[0]) return;
    setPicUploading(true);
    try {
      const file = e.target.files[0];
      const storageRef = ref(storage, `profile-pictures/${authUser.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setProfilePicUrl(url);
    } catch {
      // Handle upload error
    } finally {
      setPicUploading(false);
    }
  }

  async function handlePrompt() {
    setPromptLoading(true);
    setPromptError('');
    setPrompts([]);
    try {
      // Create a sample "match" profile for testing
      const sampleMatch = {
        name: 'Sample Match',
        values: ['integrity', 'creativity', 'curiosity'],
        goals: ['collaborate on projects', 'expand network']
      };

      const currentUser = {
        name: profile.name || authUser?.email || 'User',
        values: profile.values ? profile.values.split(',').map(v => v.trim()) : [],
        goals: profile.goals ? profile.goals.split(',').map(g => g.trim()) : []
      };

      const res = await fetch('/api/conversation-starters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userProfile: currentUser, 
          matchProfile: sampleMatch 
        }),
      });
      
      const data = await res.json();
      if (data.starters) {
        setPrompts(data.starters);
      } else {
        setPromptError('No prompts found.');
      }
    } catch (err) {
      console.error('Error generating prompts:', err);
      setPromptError('Failed to generate prompts.');
    } finally {
      setPromptLoading(false);
    }
  }

  async function handleUserSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearchLoading(true);
    setSearchError('');
    setSearchResults([]);
    try {
      if (!authUser) throw new Error('Not authenticated');
      const idToken = await authUser.getIdToken();
      const res = await fetch(`/api/searchUsers?query=${encodeURIComponent(searchQuery)}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      if (!res.ok) throw new Error('Failed to search users');
      const data = await res.json();
      setSearchResults(data.users || []);
    } catch {
      setSearchError('Error searching users.');
    } finally {
      setSearchLoading(false);
    }
  }

  // Show loading while checking auth or loading profile
  if (!authChecked || (authUser && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 text-lg">Loading...</div>
      </div>
    );
  }

  // If no user after auth check is complete, don't render anything (redirect will happen)
  if (!authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 text-lg">Redirecting to login...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <nav className="w-full max-w-xl mx-auto mb-8 flex justify-between items-center">
        <div className="flex gap-4">
          <Link href="/">
            <span className="text-blue-600 hover:underline font-medium">Onboarding</span>
          </Link>
          <Link href="/discover">
            <span className="text-blue-600 hover:underline font-medium">Discover Profiles</span>
          </Link>
        </div>
        <button
          className="text-red-600 hover:underline text-sm"
          onClick={async () => {
            await signOut(auth);
            router.push('/');
          }}
        >
          Logout
        </button>
      </nav>
      <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-8 flex flex-col items-center">
        {/* User Search Bar */}
        <div className="mb-8 p-4 bg-white rounded shadow">
          <form onSubmit={handleUserSearch} className="flex flex-col sm:flex-row gap-2 items-center">
            <input
              type="text"
              className="border rounded px-3 py-2 w-full sm:w-64"
              placeholder="Search users by name, value, goal, or preference..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              disabled={searchLoading || !searchQuery.trim()}
            >
              {searchLoading ? 'Searching...' : 'Search'}
            </button>
          </form>
          {searchError && <div className="text-red-600 mt-2">{searchError}</div>}
          {searchResults.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Results:</h3>
              <ul className="space-y-4">
                {searchResults.map((user) => (
                  <li key={user.id} className="border rounded p-3 bg-gray-50">
                    <div className="font-bold text-lg">{user.name}</div>
                    <div><span className="font-semibold">Values:</span> {user.values?.join(', ')}</div>
                    <div><span className="font-semibold">Goals:</span> {user.goals?.join(', ')}</div>
                    <div><span className="font-semibold">Preferences:</span> {user.preferences?.join(', ')}</div>
                    {user.publicProfiles?.linkedin && (
                      <div className="text-sm text-gray-600 mt-1">
                        <a href={user.publicProfiles?.linkedin} target="_blank" rel="noopener noreferrer" className="mr-2 underline">LinkedIn</a>
                      </div>
                    )}
                    {user.publicProfiles?.twitter && (
                      <div className="text-sm text-gray-600 mt-1">
                        <a href={user.publicProfiles?.twitter} target="_blank" rel="noopener noreferrer" className="mr-2 underline">Twitter</a>
                      </div>
                    )}
                    {user.publicProfiles?.instagram && (
                      <div className="text-sm text-gray-600 mt-1">
                        <a href={user.publicProfiles?.instagram} target="_blank" rel="noopener noreferrer" className="mr-2 underline">Instagram</a>
                      </div>
                    )}
                    {user.publicProfiles?.tiktok && (
                      <div className="text-sm text-gray-600 mt-1">
                        <a href={user.publicProfiles?.tiktok} target="_blank" rel="noopener noreferrer" className="mr-2 underline">TikTok</a>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        {/* Profile Picture and Name */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-24 h-24 mb-2">
            {profilePicUrl ? (
              <img src={profilePicUrl} alt="Profile" className="w-24 h-24 rounded-full object-cover border" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-3xl font-bold text-gray-600 border">
                {profile.name ? profile.name[0].toUpperCase() : (authUser?.email?.[0]?.toUpperCase() || '?')}
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="absolute bottom-0 left-0 w-full opacity-0 cursor-pointer h-full"
              title="Upload profile picture"
              onChange={handlePicUpload}
              disabled={picUploading}
            />
            {picUploading && <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 text-xs">Uploading...</div>}
          </div>
          <div className="text-xl font-semibold mt-2">{profile.name || authUser?.email || 'User'}</div>
        </div>
        {/* About You Section */}
        <form className="w-full" onSubmit={handleSubmit}>
          <h2 className="text-lg font-bold mb-2 mt-2">About You</h2>
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
          <h2 className="text-lg font-bold mb-2 mt-6">Social Profiles</h2>
          <label className="block mb-2 font-semibold">LinkedIn URL</label>
          <input
            className="w-full border rounded p-2 mb-2"
            type="url"
            placeholder="LinkedIn URL"
            value={profile.publicProfiles?.linkedin}
            onChange={(e) => setProfile({ ...profile, publicProfiles: { ...profile.publicProfiles, linkedin: e.target.value } })}
          />
          <label className="block mb-2 font-semibold">Twitter URL</label>
          <input
            className="w-full border rounded p-2 mb-2"
            type="url"
            placeholder="Twitter URL"
            value={profile.publicProfiles?.twitter}
            onChange={(e) => setProfile({ ...profile, publicProfiles: { ...profile.publicProfiles, twitter: e.target.value } })}
          />
          <label className="block mb-2 font-semibold">Instagram URL</label>
          <input
            className="w-full border rounded p-2 mb-2"
            type="url"
            placeholder="Instagram URL"
            value={profile.publicProfiles?.instagram}
            onChange={(e) => setProfile({ ...profile, publicProfiles: { ...profile.publicProfiles, instagram: e.target.value } })}
          />
          <label className="block mb-2 font-semibold">TikTok URL</label>
          <input
            className="w-full border rounded p-2 mb-2"
            type="url"
            placeholder="TikTok URL"
            value={profile.publicProfiles?.tiktok}
            onChange={(e) => setProfile({ ...profile, publicProfiles: { ...profile.publicProfiles, tiktok: e.target.value } })}
          />
          <label className="block mb-2 font-semibold">OnlyFans URL</label>
          <input
            className="w-full border rounded p-2 mb-4"
            type="url"
            placeholder="OnlyFans URL"
            value={profile.publicProfiles?.onlyfans}
            onChange={(e) => setProfile({ ...profile, publicProfiles: { ...profile.publicProfiles, onlyfans: e.target.value } })}
          />
          <button
            type="submit"
            className="w-full bg-green-500 text-white py-2 rounded mt-4"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
        {/* Conversation Prompts Section */}
        <div className="w-full mt-8">
          <h2 className="text-lg font-bold mb-2">Test Conversation Prompts</h2>
          <div className="text-xs text-gray-500 mb-2">This generates sample conversation starters between you and a test profile.</div>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded mb-2"
            onClick={handlePrompt}
            disabled={promptLoading}
          >
            {promptLoading ? 'Generating...' : 'Generate Test Prompts'}
          </button>
          {promptError && <div className="text-red-600 text-sm mt-2">{promptError}</div>}
          {prompts.length > 0 && (
            <ul className="mt-2 text-sm bg-blue-50 rounded p-2">
              {prompts.map((p, idx) => <li key={idx}>💬 {p}</li>)}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}