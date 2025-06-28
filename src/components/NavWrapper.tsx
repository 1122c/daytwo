"use client";
import React, { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

export default function NavWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideNav = pathname === '/' || pathname === '/login' || pathname === '/signup';
  return (
    <>
      {!hideNav && (
        <nav className="w-full flex items-center justify-between px-4 py-4 bg-gray-900 text-white text-sm mb-8 shadow">
          <div>ConnectMind</div>
          <div className="flex gap-3">
            <a href="/onboarding" className="px-3 py-1 rounded-md bg-gray-800 text-white no-underline hover:bg-blue-600 transition-colors">Onboarding</a>
            <a href="/discover" className="px-3 py-1 rounded-md bg-gray-800 text-white no-underline hover:bg-blue-600 transition-colors">Discover Profiles</a>
            <a href="/matches" className="px-3 py-1 rounded-md bg-gray-800 text-white no-underline hover:bg-blue-600 transition-colors">Matches</a>
            <a href="/conversation-starters" className="px-3 py-1 rounded-md bg-gray-800 text-white no-underline hover:bg-blue-600 transition-colors">Conversation Starters</a>
          </div>
        </nav>
      )}
      {children}
    </>
  );
} 