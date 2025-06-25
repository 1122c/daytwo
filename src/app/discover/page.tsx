import { sampleUserProfiles } from '../../services/websocketService';
import Link from 'next/link';

export default function ProfileDiscoveryPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <nav className="w-full max-w-2xl mx-auto mb-8 flex justify-end">
        <Link href="/">
          <span className="text-blue-600 hover:underline font-medium">Onboarding</span>
        </Link>
      </nav>
      <h1 className="text-3xl font-bold text-center mb-8">Discover Profiles</h1>
      <div className="max-w-2xl mx-auto grid gap-6">
        {sampleUserProfiles.map((profile) => (
          <div key={profile.id} className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-2">{profile.name}</h2>
            <div className="mb-1 text-gray-700">
              <span className="font-medium">Values:</span> {profile.values.join(', ')}
            </div>
            <div className="mb-1 text-gray-700">
              <span className="font-medium">Goals:</span> {profile.goals.join(', ')}
            </div>
            <div className="mb-1 text-gray-700">
              <span className="font-medium">Preferences:</span> {profile.preferences.join(', ')}
            </div>
            {profile.publicProfiles && (
              <div className="mt-2">
                <span className="font-medium">Public Profiles:</span>
                <ul className="list-disc list-inside text-blue-600">
                  {Object.entries(profile.publicProfiles).map(([platform, url]) =>
                    url ? (
                      <li key={platform}>
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          {platform.charAt(0).toUpperCase() + platform.slice(1)}
                        </a>
                      </li>
                    ) : null
                  )}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 