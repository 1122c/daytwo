"use client";
import { usePathname } from 'next/navigation';
import UserSearchBar from './UserSearchBar';
import UserMatchesBar from './UserMatchesBar';

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <>
      <nav className="w-full flex items-center justify-between px-4 py-4 bg-gray-900 text-white text-sm mb-8 shadow">
        <div>TEST NAV</div>
        <div className="flex gap-3">
          <a href="/onboarding" className="px-3 py-1 rounded-md bg-gray-800 text-white no-underline hover:bg-blue-600 transition-colors">Onboarding</a>
          <a href="/chat" className="px-3 py-1 rounded-md bg-gray-800 text-white no-underline hover:bg-blue-600 transition-colors">Chat</a>
          <a href="/conversation-starters" className="px-3 py-1 rounded-md bg-gray-800 text-white no-underline hover:bg-blue-600 transition-colors">Conversation Starters</a>
        </div>
      </nav>
      {pathname !== '/' && <UserSearchBar className="max-w-2xl mx-auto" />}
      {pathname !== '/' && <UserMatchesBar className="max-w-2xl mx-auto" />}
      <main>{children}</main>
    </>
  );
} 