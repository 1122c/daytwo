"use client";
import React, { useState } from "react";
import { db } from "@/services/firebase";
import { collection, addDoc } from "firebase/firestore";

const steps = ["Values", "Goals", "Public Profiles"];

export default function OnboardingForm() {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState("");
  const [goals, setGoals] = useState("");
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
    try {
      await addDoc(collection(db, "profiles"), {
        values,
        goals,
        publicProfiles: profiles,
        createdAt: new Date(),
      });
      setSuccess(true);
      setValues("");
      setGoals("");
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
            />
          </div>
        )}
        {step === 2 && (
          <div>
            <label className="block mb-2 font-semibold">Public Profiles (optional)</label>
            <input
              className="w-full border rounded p-2 mb-2"
              type="url"
              placeholder="LinkedIn URL"
              value={profiles.linkedin}
              onChange={(e) => setProfiles({ ...profiles, linkedin: e.target.value })}
            />
            <input
              className="w-full border rounded p-2 mb-2"
              type="url"
              placeholder="Twitter URL"
              value={profiles.twitter}
              onChange={(e) => setProfiles({ ...profiles, twitter: e.target.value })}
            />
            <input
              className="w-full border rounded p-2 mb-2"
              type="url"
              placeholder="Instagram URL"
              value={profiles.instagram}
              onChange={(e) => setProfiles({ ...profiles, instagram: e.target.value })}
            />
            <input
              className="w-full border rounded p-2 mb-2"
              type="url"
              placeholder="TikTok URL"
              value={profiles.tiktok}
              onChange={(e) => setProfiles({ ...profiles, tiktok: e.target.value })}
            />
            <input
              className="w-full border rounded p-2 mb-2"
              type="url"
              placeholder="OnlyFans URL"
              value={profiles.onlyfans}
              onChange={(e) => setProfiles({ ...profiles, onlyfans: e.target.value })}
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
            disabled={loading}
          >
            Next
          </button>
        ) : (
          <button
            type="submit"
            className="px-4 py-2 bg-green-500 text-white rounded"
            disabled={loading}
          >
            {loading ? "Saving..." : "Submit"}
          </button>
        )}
      </div>
    </form>
  );
} 