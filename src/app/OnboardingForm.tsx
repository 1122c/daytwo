"use client";
import React, { useState, useEffect } from "react";
import { db, auth } from "@/services/firebase";
import { setDoc, doc, getDocs, collection, query, where } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";

const steps = [
  "Values",
  "Goals",
  "Preferences",
  "Communication Style",
  "Interests",
  "Connection Type",
  "Growth Areas",
  "Availability",
  "Location/Timezone",
  "Identity Tags",
  "Public Profiles"
];

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

// Helper function to normalize URLs
const normalizeUrl = (url: string): string => {
  if (!url) return '';
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return '';
  if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
    return `https://${trimmedUrl}`;
  }
  return trimmedUrl;
};

export default function OnboardingForm() {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState("");
  const [goals, setGoals] = useState("");
  const [preferences, setPreferences] = useState("");
  const [communicationStyle, setCommunicationStyle] = useState("");
  const [interests, setInterests] = useState("");
  const [connectionType, setConnectionType] = useState("");
  const [growthAreas, setGrowthAreas] = useState("");
  const [availability, setAvailability] = useState("");
  const [location, setLocation] = useState("");
  const [timezone, setTimezone] = useState("");
  const [identityTags, setIdentityTags] = useState("");
  const [profiles, setProfiles] = useState({
    linkedin: "",
    twitter: "",
    instagram: "",
    tiktok: "",
    onlyfans: "",
    website: "",
  });
  const [socialError, setSocialError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  function handleNext() {
    setStep((s) => Math.min(s + 1, steps.length - 1));
  }
  function handleBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function addChip(
    setter: React.Dispatch<React.SetStateAction<string>>,
    value: string,
    current: string
  ) {
    const arr = current.split(",").map((v: string) => v.trim().toLowerCase()).filter(Boolean);
    if (!arr.includes(value)) {
      setter((prev: string) => (prev ? prev + ", " + value : value));
    }
  }

  // Username uniqueness check
  async function checkUsernameUnique(name: string) {
    if (!name.trim()) return false;
    const q = query(collection(db, "profiles"), where("name", "==", name.trim()));
    const snap = await getDocs(q);
    // If editing, allow the current user to keep their username
    if (snap.empty) return true;
    if (snap.docs.length === 1 && snap.docs[0].id === user?.uid) return true;
    return false;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log("Submit button clicked");
    setLoading(true);
    setSuccess(false);
    setUsernameError("");
    setSocialError("");
    
    if (!user) {
      console.log("No user found");
      setLoading(false);
      return;
    }
    console.log("User found:", user.email);
    
    // Username required and must be unique
    if (!username.trim()) {
      console.log("Username is empty");
      setUsernameError("Username is required.");
      setLoading(false);
      return;
    }
    console.log("Username:", username);
    
    const isUnique = await checkUsernameUnique(username.trim());
    console.log("Username unique check:", isUnique);
    if (!isUnique) {
      setUsernameError("That username is already taken. Please choose another.");
      setLoading(false);
      return;
    }
    
    // At least one social URL required
    const hasSocial = Object.values(profiles).some((v) => v.trim() !== "");
    console.log("Has social profiles:", hasSocial);
    console.log("Profile values:", profiles);
    if (!hasSocial) {
      setSocialError("Please provide at least one social URL.");
      setLoading(false);
      setStep(10);
      return;
    }
    
    try {
      console.log("Attempting to save profile...");
      // Normalize all profile URLs before saving
      const normalizedProfiles = {
        linkedin: normalizeUrl(profiles.linkedin),
        twitter: normalizeUrl(profiles.twitter),
        instagram: normalizeUrl(profiles.instagram),
        tiktok: normalizeUrl(profiles.tiktok),
        onlyfans: normalizeUrl(profiles.onlyfans),
        website: normalizeUrl(profiles.website),
      };
      console.log("Normalized profiles:", normalizedProfiles);
      
      const profileData = {
        values: values ? values.split(",").map((v) => v.trim().toLowerCase()).filter(Boolean) : [],
        goals: goals ? goals.split(",").map((g) => g.trim().toLowerCase()).filter(Boolean) : [],
        preferences: preferences ? preferences.split(",").map((p) => p.trim().toLowerCase()).filter(Boolean) : [],
        communicationStyle: communicationStyle ? communicationStyle.split(",").map((c) => c.trim().toLowerCase()).filter(Boolean) : [],
        interests: interests ? interests.split(",").map((i) => i.trim().toLowerCase()).filter(Boolean) : [],
        connectionType: connectionType ? connectionType.split(",").map((c) => c.trim().toLowerCase()).filter(Boolean) : [],
        growthAreas: growthAreas ? growthAreas.split(",").map((g) => g.trim().toLowerCase()).filter(Boolean) : [],
        availability: availability ? availability.split(",").map((a) => a.trim().toLowerCase()).filter(Boolean) : [],
        location: location ? location.trim() : "",
        timezone: timezone ? timezone.trim() : "",
        identityTags: identityTags ? identityTags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean) : [],
        publicProfiles: normalizedProfiles,
        createdAt: new Date(),
        name: username.trim(),
        uid: user.uid,
        email: user.email || "",
      };
      
      console.log("Profile data to save:", profileData);
      
      await setDoc(doc(db, "profiles", user.uid), profileData);
      console.log("Profile saved successfully!");
      setSuccess(true);
      router.push("/dashboard");
    } catch (error) {
      console.error("Error saving profile:", error);
      setSocialError("There was an error saving your profile. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg mt-8"
      onSubmit={handleSubmit}
    >
      <div className="mb-4">
        <div className="text-sm text-gray-500 mb-2">
          Step {step + 1} of {steps.length}: {steps[step]}
        </div>
        {!user && (
          <div className="mb-2 text-red-600">You must be logged in to submit your profile.</div>
        )}
        {success && (
          <div className="mb-2 text-green-600">Profile saved successfully!</div>
        )}
        
        {/* Show username status on all steps */}
        {step > 0 && (
          <div className="mb-3 p-2 bg-gray-100 rounded text-sm">
            <span className="font-semibold">Username:</span> {username || <span className="text-red-600">Not set - go back to step 1!</span>}
          </div>
        )}
        
        {step === 0 && (
          <div>
            <label className="block mb-2 font-semibold">
              Choose a username <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full border rounded p-2 mb-1"
              type="text"
              placeholder="e.g. rachel, dayonefan, mentor_jane"
              value={username}
              onChange={e => { setUsername(e.target.value); setUsernameError(""); }}
              required
              disabled={!user}
              spellCheck={false}
              maxLength={32}
            />
            <div className="text-xs text-gray-500 mb-2">This will be your unique identifier on the platform</div>
            {usernameError && <div className="text-red-600 text-sm mb-2">{usernameError}</div>}
            
            <label className="block mb-2 font-semibold mt-4">
              What are your core values?
            </label>
            <div className="text-xs text-gray-500 mb-1">e.g. what matters most to you in relationships and life? (optional)</div>
            <div className="flex flex-wrap gap-2 mb-2">
              {EXAMPLES.values.map((ex) => (
                <button type="button" key={ex} className="px-2 py-1 bg-gray-200 rounded text-xs" onClick={() => addChip(setValues, ex, values)}>{ex}</button>
              ))}
            </div>
            <input
              className="w-full border rounded p-2"
              type="text"
              placeholder="e.g. empathy, growth, curiosity"
              value={values}
              onChange={(e) => setValues(e.target.value)}
              disabled={!user}
              spellCheck={true}
            />
            <div className="text-xs text-gray-500 mt-4">
              <span className="text-red-500">*</span> Required field
            </div>
          </div>
        )}
        {step === 1 && (
          <div>
            <label className="block mb-2 font-semibold">
              What are your relational goals?
            </label>
            <div className="text-xs text-gray-500 mb-1">e.g. what do you hope to get out of this platform? (optional)</div>
            <div className="flex flex-wrap gap-2 mb-2">
              {EXAMPLES.goals.map((ex) => (
                <button type="button" key={ex} className="px-2 py-1 bg-gray-200 rounded text-xs" onClick={() => addChip(setGoals, ex, goals)}>{ex}</button>
              ))}
            </div>
            <input
              className="w-full border rounded p-2"
              type="text"
              placeholder="e.g. find a mentor, make friends"
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              disabled={!user}
              spellCheck={true}
            />
          </div>
        )}
        {step === 2 && (
          <div>
            <label className="block mb-2 font-semibold">Preferences (comma separated, optional)</label>
            <div className="text-xs text-gray-500 mb-1">e.g. how do you prefer to connect?</div>
            <div className="flex flex-wrap gap-2 mb-2">
              {EXAMPLES.preferences.map((ex) => (
                <button type="button" key={ex} className="px-2 py-1 bg-gray-200 rounded text-xs" onClick={() => addChip(setPreferences, ex, preferences)}>{ex}</button>
              ))}
            </div>
            <input
              className="w-full border rounded p-2"
              type="text"
              placeholder="e.g. small group, remote, in-person"
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              disabled={!user}
              spellCheck={true}
            />
          </div>
        )}
        {step === 3 && (
          <div>
            <label className="block mb-2 font-semibold">Communication Style (comma separated, optional)</label>
            <div className="text-xs text-gray-500 mb-1">e.g. how do you like to communicate?</div>
            <div className="flex flex-wrap gap-2 mb-2">
              {EXAMPLES.communicationStyle.map((ex) => (
                <button type="button" key={ex} className="px-2 py-1 bg-gray-200 rounded text-xs" onClick={() => addChip(setCommunicationStyle, ex, communicationStyle)}>{ex}</button>
              ))}
            </div>
            <input
              className="w-full border rounded p-2"
              type="text"
              placeholder="e.g. direct, reflective, supportive, analytical"
              value={communicationStyle}
              onChange={(e) => setCommunicationStyle(e.target.value)}
              disabled={!user}
              spellCheck={true}
            />
          </div>
        )}
        {step === 4 && (
          <div>
            <label className="block mb-2 font-semibold">Interests (comma separated, optional)</label>
            <div className="text-xs text-gray-500 mb-1">e.g. what are you passionate about?</div>
            <div className="flex flex-wrap gap-2 mb-2">
              {EXAMPLES.interests.map((ex) => (
                <button type="button" key={ex} className="px-2 py-1 bg-gray-200 rounded text-xs" onClick={() => addChip(setInterests, ex, interests)}>{ex}</button>
              ))}
            </div>
            <input
              className="w-full border rounded p-2"
              type="text"
              placeholder="e.g. art, tech, outdoors, music, volunteering"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              disabled={!user}
              spellCheck={true}
            />
          </div>
        )}
        {step === 5 && (
          <div>
            <label className="block mb-2 font-semibold">Connection Type (comma separated, optional)</label>
            <div className="text-xs text-gray-500 mb-1">e.g. what kind of connection are you seeking?</div>
            <div className="flex flex-wrap gap-2 mb-2">
              {EXAMPLES.connectionType.map((ex) => (
                <button type="button" key={ex} className="px-2 py-1 bg-gray-200 rounded text-xs" onClick={() => addChip(setConnectionType, ex, connectionType)}>{ex}</button>
              ))}
            </div>
            <input
              className="w-full border rounded p-2"
              type="text"
              placeholder="e.g. mentorship, collaboration, friendship, accountability partner"
              value={connectionType}
              onChange={(e) => setConnectionType(e.target.value)}
              disabled={!user}
              spellCheck={true}
            />
          </div>
        )}
        {step === 6 && (
          <div>
            <label className="block mb-2 font-semibold">Growth Areas (comma separated, optional)</label>
            <div className="text-xs text-gray-500 mb-1">e.g. what do you want to work on or improve?</div>
            <div className="flex flex-wrap gap-2 mb-2">
              {EXAMPLES.growthAreas.map((ex) => (
                <button type="button" key={ex} className="px-2 py-1 bg-gray-200 rounded text-xs" onClick={() => addChip(setGrowthAreas, ex, growthAreas)}>{ex}</button>
              ))}
            </div>
            <input
              className="w-full border rounded p-2"
              type="text"
              placeholder="e.g. leadership, emotional intelligence, public speaking"
              value={growthAreas}
              onChange={(e) => setGrowthAreas(e.target.value)}
              disabled={!user}
              spellCheck={true}
            />
          </div>
        )}
        {step === 7 && (
          <div>
            <label className="block mb-2 font-semibold">Availability (comma separated, optional)</label>
            <div className="text-xs text-gray-500 mb-1">e.g. when are you usually available to connect?</div>
            <div className="flex flex-wrap gap-2 mb-2">
              {EXAMPLES.availability.map((ex) => (
                <button type="button" key={ex} className="px-2 py-1 bg-gray-200 rounded text-xs" onClick={() => addChip(setAvailability, ex, availability)}>{ex}</button>
              ))}
            </div>
            <input
              className="w-full border rounded p-2"
              type="text"
              placeholder="e.g. weekdays, evenings, weekends, flexible"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              disabled={!user}
              spellCheck={true}
            />
          </div>
        )}
        {step === 8 && (
          <div>
            <label className="block mb-2 font-semibold">Location (optional)</label>
            <input
              className="w-full border rounded p-2"
              type="text"
              placeholder="e.g. New York, Remote"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={!user}
            />
            <label className="block mb-2 font-semibold mt-2">Timezone (optional)</label>
            <input
              className="w-full border rounded p-2"
              type="text"
              placeholder="e.g. EST, PST"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              disabled={!user}
            />
          </div>
        )}
        {step === 9 && (
          <div>
            <label className="block mb-2 font-semibold">Identity Tags (comma separated, optional)</label>
            <div className="text-xs text-gray-500 mb-1">e.g. communities or identities you want to connect around</div>
            <div className="flex flex-wrap gap-2 mb-2">
              {EXAMPLES.identityTags.map((ex) => (
                <button type="button" key={ex} className="px-2 py-1 bg-gray-200 rounded text-xs" onClick={() => addChip(setIdentityTags, ex, identityTags)}>{ex}</button>
              ))}
            </div>
            <input
              className="w-full border rounded p-2"
              type="text"
              placeholder="e.g. LGBTQ+, Women in Tech, BIPOC"
              value={identityTags}
              onChange={(e) => setIdentityTags(e.target.value)}
              disabled={!user}
              spellCheck={true}
            />
          </div>
        )}
        {step === 10 && (
          <div>
            <label className="block mb-2 font-semibold">
              Public Profiles <span className="text-red-500">*</span>
              <span className="text-sm font-normal text-gray-600 ml-2">(at least one required)</span>
            </label>
            {socialError && <div className="mb-2 text-red-600">{socialError}</div>}
            <input
              className="w-full border rounded p-2 mb-2"
              type="text"
              placeholder="LinkedIn URL (e.g., linkedin.com/in/username)"
              value={profiles.linkedin}
              onChange={(e) => {
                setProfiles({ ...profiles, linkedin: e.target.value });
                setSocialError("");
              }}
              disabled={!user}
            />
            <input
              className="w-full border rounded p-2 mb-2"
              type="text"
              placeholder="Twitter URL (e.g., twitter.com/username)"
              value={profiles.twitter}
              onChange={(e) => {
                setProfiles({ ...profiles, twitter: e.target.value });
                setSocialError("");
              }}
              disabled={!user}
            />
            <input
              className="w-full border rounded p-2 mb-2"
              type="text"
              placeholder="Instagram URL (e.g., instagram.com/username)"
              value={profiles.instagram}
              onChange={(e) => {
                setProfiles({ ...profiles, instagram: e.target.value });
                setSocialError("");
              }}
              disabled={!user}
            />
            <input
              className="w-full border rounded p-2 mb-2"
              type="text"
              placeholder="TikTok URL (e.g., tiktok.com/@username)"
              value={profiles.tiktok}
              onChange={(e) => {
                setProfiles({ ...profiles, tiktok: e.target.value });
                setSocialError("");
              }}
              disabled={!user}
            />
            <input
              className="w-full border rounded p-2 mb-2"
              type="text"
              placeholder="OnlyFans URL"
              value={profiles.onlyfans}
              onChange={(e) => {
                setProfiles({ ...profiles, onlyfans: e.target.value });
                setSocialError("");
              }}
              disabled={!user}
            />
            <input
              className="w-full border rounded p-2 mb-2"
              type="text"
              placeholder="Personal Website URL"
              value={profiles.website}
              onChange={(e) => {
                setProfiles({ ...profiles, website: e.target.value });
                setSocialError("");
              }}
              disabled={!user}
            />
            <div className="text-xs text-gray-500 mt-2">
              💡 Tip: You can enter URLs with or without https://
            </div>
            <div className="text-xs text-gray-500">
              <span className="text-red-500">*</span> At least one social profile is required
            </div>
          </div>
        )}
      </div>
      <div className="flex justify-between">
        <button
          type="button"
          className="px-4 py-2 bg-gray-200 rounded"
          onClick={handleBack}
          disabled={step === 0 || loading}
        >
          Back
        </button>
        {step < steps.length - 1 ? (
          <button
            type="button"
            className="px-4 py-2 bg-blue-500 text-white rounded"
            onClick={handleNext}
            disabled={loading || !user}
          >
            Next
          </button>
        ) : (
          <button
            type="submit"
            className="px-4 py-2 bg-green-500 text-white rounded"
            disabled={loading || !user}
          >
            {loading ? "Saving..." : "Submit"}
          </button>
        )}
      </div>
    </form>
  );
}