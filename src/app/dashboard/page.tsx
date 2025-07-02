"use client";
import { useEffect, useState } from 'react';
import { auth, db, storage } from '@/services/firebase';
import { onAuthStateChanged, User, updateEmail } from 'firebase/auth';
import { doc, getDoc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import React from 'react';
import type { UserProfile } from '@/services/websocketService';
import Image from 'next/image';

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
    allowStrangerChats: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);
  const [picUploading, setPicUploading] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

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
            allowStrangerChats: data.allowStrangerChats ?? false,
          });
          setEmail(data.email || authUser?.email || '');
        } else {
          setEmail(authUser?.email || '');
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

  async function checkUsernameUnique(name: string) {
    if (!name.trim()) return false;
    const q = query(collection(db, 'profiles'), where('name', '==', name.trim()));
    const snap = await getDocs(q);
    // Allow the current user to keep their username
    if (snap.empty) return true;
    if (snap.docs.length === 1 && snap.docs[0].id === authUser?.uid) return true;
    return false;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!authUser) {
      return;
    }
    setSaving(true);
    setUsernameError('');
    setEmailError('');
    setSaveSuccess(false);
    // Username required and must be unique
    if (!profile.name.trim()) {
      setUsernameError('Username is required.');
      setSaving(false);
      return;
    }
    const isUnique = await checkUsernameUnique(profile.name.trim());
    if (!isUnique) {
      setUsernameError('That username is already taken. Please choose another.');
      setSaving(false);
      return;
    }
    // Email required and must be valid
    if (!email.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setEmailError('A valid email address is required.');
      setSaving(false);
      return;
    }
    // If email changed, update in Firebase Auth
    if (email.trim() !== authUser.email) {
      try {
        await updateEmail(authUser, email.trim());
      } catch (err: unknown) {
        let msg = 'Failed to update email.';
        if (typeof err === 'object' && err && 'message' in err) {
          const errorWithMessage = err as { message?: string };
          if (typeof errorWithMessage.message === 'string') {
            msg = errorWithMessage.message;
          }
        }
        setEmailError(msg);
        setSaving(false);
        return;
      }
    }
    try {
      await setDoc(doc(db, 'profiles', authUser.uid), {
        name: profile.name.trim(),
        email: email.trim(),
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
        allowStrangerChats: profile.allowStrangerChats,
        uid: authUser.uid,
        updatedAt: new Date(),
      }, { merge: true });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
      console.log('Profile saved successfully');
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setSaving(false);
    }
  }

  // Hide confirmation when user edits any field
  function handleFieldEdit<T extends unknown[]>(fn: (...args: T) => void) {
    return (...args: T) => {
      setSaveSuccess(false);
      fn(...args);
    };
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
      <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-8 flex flex-col items-center">
        {/* Profile Picture and Name */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-24 h-24 mb-2">
            {profilePicUrl ? (
              <Image src={profilePicUrl} alt="Profile" className="w-24 h-24 rounded-full object-cover border" width={96} height={96} />
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
          {saveSuccess && (
            <div className="mb-4 p-2 bg-green-100 text-green-800 rounded text-center animate-fade-in">
              Profile updated successfully!
            </div>
          )}
          <h2 className="text-lg font-bold mb-2 mt-2">About You</h2>
          <label className="block mb-2 font-semibold">Email</label>
          <input
            className="w-full border rounded p-2 mb-2"
            type="email"
            value={email}
            onChange={handleFieldEdit(e => { setEmail(e.target.value); setEmailError(''); })}
            placeholder="e.g. you@email.com"
            required
            maxLength={64}
          />
          {emailError && <div className="text-red-600 text-sm mb-2">{emailError}</div>}
          <label className="block mb-2 font-semibold">Name</label>
          <input
            className="w-full border rounded p-2 mb-2"
            type="text"
            value={profile.name}
            onChange={handleFieldEdit((e) => { setProfile({ ...profile, name: e.target.value }); setUsernameError(''); })}
            placeholder="e.g. rachel, dayonefan, mentor_jane"
            required
            maxLength={32}
          />
          {usernameError && <div className="text-red-600 text-sm mb-2">{usernameError}</div>}
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
            onChange={handleFieldEdit((e) => setProfile({ ...profile, values: e.target.value }))}
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
            onChange={handleFieldEdit((e) => setProfile({ ...profile, goals: e.target.value }))}
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
            onChange={handleFieldEdit((e) => setProfile({ ...profile, preferences: e.target.value }))}
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
            onChange={handleFieldEdit((e) => setProfile({ ...profile, communicationStyle: e.target.value }))}
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
            onChange={handleFieldEdit((e) => setProfile({ ...profile, interests: e.target.value }))}
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
            onChange={handleFieldEdit((e) => setProfile({ ...profile, connectionType: e.target.value }))}
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
            onChange={handleFieldEdit((e) => setProfile({ ...profile, growthAreas: e.target.value }))}
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
            onChange={handleFieldEdit((e) => setProfile({ ...profile, availability: e.target.value }))}
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
            onChange={handleFieldEdit((e) => setProfile({ ...profile, identityTags: e.target.value }))}
            placeholder="e.g. LGBTQ+, Women in Tech, BIPOC"
            spellCheck={true}
          />
          <label className="block mb-2 font-semibold">Privacy</label>
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="allowStrangerChats"
              checked={profile.allowStrangerChats}
              onChange={e => setProfile({ ...profile, allowStrangerChats: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="allowStrangerChats" className="text-sm">Allow users who aren&apos;t connected with me to start a chat</label>
          </div>
          <h2 className="text-lg font-bold mb-2 mt-6">Social Profiles</h2>
          <label className="block mb-2 font-semibold">LinkedIn URL</label>
          <input
            className="w-full border rounded p-2 mb-2"
            type="url"
            placeholder="LinkedIn URL"
            value={profile.publicProfiles?.linkedin}
            onChange={handleFieldEdit((e) => setProfile({ ...profile, publicProfiles: { ...profile.publicProfiles, linkedin: e.target.value } }))}
          />
          <label className="block mb-2 font-semibold">Twitter URL</label>
          <input
            className="w-full border rounded p-2 mb-2"
            type="url"
            placeholder="Twitter URL"
            value={profile.publicProfiles?.twitter}
            onChange={handleFieldEdit((e) => setProfile({ ...profile, publicProfiles: { ...profile.publicProfiles, twitter: e.target.value } }))}
          />
          <label className="block mb-2 font-semibold">Instagram URL</label>
          <input
            className="w-full border rounded p-2 mb-2"
            type="url"
            placeholder="Instagram URL"
            value={profile.publicProfiles?.instagram}
            onChange={handleFieldEdit((e) => setProfile({ ...profile, publicProfiles: { ...profile.publicProfiles, instagram: e.target.value } }))}
          />
          <label className="block mb-2 font-semibold">TikTok URL</label>
          <input
            className="w-full border rounded p-2 mb-2"
            type="url"
            placeholder="TikTok URL"
            value={profile.publicProfiles?.tiktok}
            onChange={handleFieldEdit((e) => setProfile({ ...profile, publicProfiles: { ...profile.publicProfiles, tiktok: e.target.value } }))}
          />
          <label className="block mb-2 font-semibold">OnlyFans URL</label>
          <input
            className="w-full border rounded p-2 mb-4"
            type="url"
            placeholder="OnlyFans URL"
            value={profile.publicProfiles?.onlyfans}
            onChange={handleFieldEdit((e) => setProfile({ ...profile, publicProfiles: { ...profile.publicProfiles, onlyfans: e.target.value } }))}
          />
          <button
            type="submit"
            className="w-full bg-green-500 text-white py-2 rounded mt-4"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}