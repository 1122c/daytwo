"use client";
import React, { useState } from "react";
import { auth, googleProvider } from "@/services/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      if (isSignup) {
        await createUserWithEmailAndPassword(auth, email, password);
        setSuccess("Account created! You can now log in.");
        setIsSignup(false);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        setSuccess("Logged in!");
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setLoading(true);
    setError("");
    try {
      await signInWithPopup(auth, googleProvider);
      setSuccess("Logged in!");
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Google login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResetSent(false);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center">
          {showReset ? "Reset Password" : isSignup ? "Sign Up" : "Login"}
        </h1>
        {error && <div className="mb-2 text-red-600 text-center">{error}</div>}
        {success && <div className="mb-2 text-green-600 text-center">{success}</div>}
        {showReset ? (
          <form onSubmit={handlePasswordReset}>
            <label className="block mb-2">Email</label>
            <input
              type="email"
              className="w-full border rounded p-2 mb-4"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded mb-2"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Reset Email"}
            </button>
            {resetSent && <div className="text-green-600 text-center mb-2">Reset email sent!</div>}
            <button
              type="button"
              className="w-full text-blue-600 hover:underline"
              onClick={() => setShowReset(false)}
            >
              Back to Login
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="block mb-2">Email</label>
            <input
              type="email"
              className="w-full border rounded p-2 mb-4"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label className="block mb-2">Password</label>
            <input
              type="password"
              className="w-full border rounded p-2 mb-4"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded mb-2"
              disabled={loading}
            >
              {loading ? (isSignup ? "Signing up..." : "Logging in...") : isSignup ? "Sign Up" : "Login"}
            </button>
            <button
              type="button"
              className="w-full bg-red-500 text-white py-2 rounded mb-2"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              Continue with Google
            </button>
            <button
              type="button"
              className="w-full text-blue-600 hover:underline mb-2"
              onClick={() => setShowReset(true)}
            >
              Forgot password?
            </button>
            <button
              type="button"
              className="w-full text-blue-600 hover:underline"
              onClick={() => {
                setIsSignup((s) => !s);
                setSuccess("");
                setError("");
              }}
            >
              {isSignup ? "Already have an account? Login" : "Don't have an account? Sign Up"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
} 