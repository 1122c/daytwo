"use client";
import React, { useState, useEffect } from "react";
import { db, auth } from "@/services/firebase";
import { setDoc, doc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";

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
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<User | null>(null);

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
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    if (!user) {
      setError("You must be logged in to submit your profile.");
      setLoading(false);
      return;
    }
    try {
      await setDoc(doc(db, "profiles", user.uid), {
        values: values ? values.split(",").map((v) => v.trim()).filter(Boolean) : [],
        goals: goals ? goals.split(",").map((g) => g.trim()).filter(Boolean) : [],
        preferences: preferences ? preferences.split(",").map((p) => p.trim()).filter(Boolean) : [],
        communicationStyle: communicationStyle ? communicationStyle.split(",").map((c) => c.trim()).filter(Boolean) : [],
        interests: interests ? interests.split(",").map((i) => i.trim()).filter(Boolean) : [],
        connectionType: connectionType ? connectionType.split(",").map((c) => c.trim()).filter(Boolean) : [],
        growthAreas: growthAreas ? growthAreas.split(",").map((g) => g.trim()).filter(Boolean) : [],
        availability: availability ? availability.split(",").map((a) => a.trim()).filter(Boolean) : [],
        location: location || "",
        timezone: timezone || "",
        identityTags: identityTags ? identityTags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        publicProfiles: profiles,
        createdAt: new Date(),
        name: user.displayName || user.email || "",
        uid: user.uid,
      });
      setSuccess(true);
      setValues("");
      setGoals("");
      setPreferences("");
      setCommunicationStyle("");
      setInterests("");
      setConnectionType("");
      setGrowthAreas("");
      setAvailability("");
      setLocation("");
      setTimezone("");
      setIdentityTags("");
      setProfiles({
        linkedin: "",
        twitter: "",
        instagram: "",
        tiktok: "",
        onlyfans: "",
      });
      setStep(0);
    } catch {
      setError("Failed to save profile. Please try again.");
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
        {error && (
          <div className="mb-2 text-red-600">{error}</div>
        )}
        {step === 0 && (
          <div>
            <label className="block mb-2 font-semibold">What are your core values?</label>
            <input
              className="w-full border rounded p-2"
              type="text"
              placeholder="e.g. empathy, growth, curiosity"
              value={values}
              onChange={(e) => setValues(e.target.value)}
              required
              disabled={!user}
            />
          </div>
        )}
        {step === 1 && (
          <div>
            <label className="block mb-2 font-semibold">What are your relational goals?</label>
            <input
              className="w-full border rounded p-2"
              type="text"
              placeholder="e.g. find a mentor, make friends"
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              required
              disabled={!user}
            />
          </div>
        )}
        {step === 2 && (
          <div>
            <label className="block mb-2 font-semibold">Preferences (comma separated, optional)</label>
            <input
              className="w-full border rounded p-2"
              type="text"
              placeholder="e.g. small group, remote"
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              disabled={!user}
            />
          </div>
        )}
        {step === 3 && (
          <div>
            <label className="block mb-2 font-semibold">Communication Style (comma separated, optional)</label>
            <input
              className="w-full border rounded p-2"
              type="text"
              placeholder="e.g. direct, reflective, supportive"
              value={communicationStyle}
              onChange={(e) => setCommunicationStyle(e.target.value)}
              disabled={!user}
            />
          </div>
        )}
        {step === 4 && (
          <div>
            <label className="block mb-2 font-semibold">Interests (comma separated, optional)</label>
            <input
              className="w-full border rounded p-2"
              type="text"
              placeholder="e.g. art, tech, outdoors"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              disabled={!user}
            />
          </div>
        )}
        {step === 5 && (
          <div>
            <label className="block mb-2 font-semibold">Connection Type (comma separated, optional)</label>
            <input
              className="w-full border rounded p-2"
              type="text"
              placeholder="e.g. mentorship, collaboration, friendship"
              value={connectionType}
              onChange={(e) => setConnectionType(e.target.value)}
              disabled={!user}
            />
          </div>
        )}
        {step === 6 && (
          <div>
            <label className="block mb-2 font-semibold">Growth Areas (comma separated, optional)</label>
            <input
              className="w-full border rounded p-2"
              type="text"
              placeholder="e.g. leadership, public speaking"
              value={growthAreas}
              onChange={(e) => setGrowthAreas(e.target.value)}
              disabled={!user}
            />
          </div>
        )}
        {step === 7 && (
          <div>
            <label className="block mb-2 font-semibold">Availability (comma separated, optional)</label>
            <input
              className="w-full border rounded p-2"
              type="text"
              placeholder="e.g. weekdays, evenings, weekends"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              disabled={!user}
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
            <input
              className="w-full border rounded p-2"
              type="text"
              placeholder="e.g. LGBTQ+, Women in Tech, BIPOC"
              value={identityTags}
              onChange={(e) => setIdentityTags(e.target.value)}
              disabled={!user}
            />
          </div>
        )}
        {step === 10 && (
          <div>
            <label className="block mb-2 font-semibold">Public Profiles (optional)</label>
            <input
              className="w-full border rounded p-2 mb-2"
              type="url"
              placeholder="LinkedIn URL"
              value={profiles.linkedin}
              onChange={(e) => setProfiles({ ...profiles, linkedin: e.target.value })}
              disabled={!user}
            />
            <input
              className="w-full border rounded p-2 mb-2"
              type="url"
              placeholder="Twitter URL"
              value={profiles.twitter}
              onChange={(e) => setProfiles({ ...profiles, twitter: e.target.value })}
              disabled={!user}
            />
            <input
              className="w-full border rounded p-2 mb-2"
              type="url"
              placeholder="Instagram URL"
              value={profiles.instagram}
              onChange={(e) => setProfiles({ ...profiles, instagram: e.target.value })}
              disabled={!user}
            />
            <input
              className="w-full border rounded p-2 mb-2"
              type="url"
              placeholder="TikTok URL"
              value={profiles.tiktok}
              onChange={(e) => setProfiles({ ...profiles, tiktok: e.target.value })}
              disabled={!user}
            />
            <input
              className="w-full border rounded p-2 mb-2"
              type="url"
              placeholder="OnlyFans URL"
              value={profiles.onlyfans}
              onChange={(e) => setProfiles({ ...profiles, onlyfans: e.target.value })}
              disabled={!user}
            />
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