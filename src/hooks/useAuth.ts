"use client";
import { useEffect, useState } from "react";
import { auth, googleProvider } from "../lib/firebase";
import { signInWithPopup, signOut as fbSignOut, onAuthStateChanged, User } from "firebase/auth";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const signOut = async () => {
    await fbSignOut(auth);
  };

  return { user, signIn, signOut };
} 