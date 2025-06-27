"use client";
import React, { useState } from "react";
import { auth } from "@/services/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PasswordRecoveryPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess("Password reset email sent!");
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-4">Password Recovery</h1>
        {error && <div className="mb-2 text-red-600 text-center">{error}</div>}
        {success && <div className="mb-2 text-green-600 text-center">{success}</div>}
        <form className="w-full" onSubmit={handleSubmit}>
          <input
            type="email"
            className="w-full border rounded p-2 mb-4"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded mb-2"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Reset Email"}
          </button>
        </form>
        <Link href="/login" className="w-full mb-2">
          <button className="w-full text-blue-600 underline py-2">Login</button>
        </Link>
        <Link href="/signup" className="w-full">
          <button className="w-full text-green-600 underline py-2">Sign Up</button>
        </Link>
      </div>
    </div>
  );
} 