"use client";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <nav className="w-full flex items-center justify-between px-4 py-4 bg-gray-900 text-white text-sm mb-8 shadow">
        <div>TEST NAV</div>
        <div className="flex gap-3">
          <a href="/onboarding" className="px-3 py-1 rounded-md bg-gray-800 text-white no-underline hover:bg-blue-600 transition-colors">Onboarding</a>
          <a href="/chat" className="px-3 py-1 rounded-md bg-gray-800 text-white no-underline hover:bg-blue-600 transition-colors">Chat</a>
        </div>
      </nav>
      <main>{children}</main>
    </>
  );
} 