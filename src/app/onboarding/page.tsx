"use client";
import { auth } from '@/services/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import OnboardingForm from '../OnboardingForm';

export default function OnboardingPage() {
  const router = useRouter();

  return (
    <div>
      {/* Logout button */}
      <div className="flex justify-end p-4">
        <button
          className="text-red-600 hover:underline text-sm"
          onClick={async () => {
            await signOut(auth);
            router.push('/');
          }}
        >
          Logout
        </button>
      </div>
      
      {/* The actual onboarding form */}
      <OnboardingForm />
    </div>
  );
}