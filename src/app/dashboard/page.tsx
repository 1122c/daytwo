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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!authUser) return;
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      await setDoc(doc(db, 'profiles', authUser.uid), {
        name: profile.name,
        values: profile.values.split(',').map((v) => v.trim()).filter(Boolean),
        goals: profile.goals.split(',').map((g) => g.trim()).filter(Boolean),
        preferences: profile.preferences.split(',').map((p) => p.trim()).filter(Boolean),
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
          />
          <label className="block mb-2 font-semibold">Values (comma separated)</label>
          <input
            className="w-full border rounded p-2 mb-4"
            type="text"
            value={profile.values}
            onChange={(e) => setProfile({ ...profile, values: e.target.value })}
          />
          <label className="block mb-2 font-semibold">Goals (comma separated)</label>
          <input
            className="w-full border rounded p-2 mb-4"
            type="text"
            value={profile.goals}
            onChange={(e) => setProfile({ ...profile, goals: e.target.value })}
          />
          <label className="block mb-2 font-semibold">Preferences (comma separated)</label>
          <input
            className="w-full border rounded p-2 mb-4"
            type="text"
            value={profile.preferences}
            onChange={(e) => setProfile({ ...profile, preferences: e.target.value })}
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