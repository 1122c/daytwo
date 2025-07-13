"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  // Example state for toggles and fields
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [theme, setTheme] = useState("system");
  const [language, setLanguage] = useState("en");
  const [profileVisibility, setProfileVisibility] = useState("connections");
  const [canMessage, setCanMessage] = useState("connections");
  const [showOnline, setShowOnline] = useState(true);
  const [showLastSeen, setShowLastSeen] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // Add more state as needed

  // Placeholder handlers
  const handleDownloadData = async () => {
    setDownloading(true);
    // TODO: Implement backend logic to download user data
    setTimeout(() => setDownloading(false), 2000);
  };
  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This cannot be undone.")) return;
    setDeleting(true);
    // TODO: Implement backend logic to delete user account
    setTimeout(() => {
      setDeleting(false);
      router.push("/");
    }, 2000);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow mt-8 mb-16">
      <h1 className="text-2xl font-bold mb-6">User Settings</h1>

      {/* Profile Info */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Profile Information</h2>
        {/* You can link to dashboard for full profile editing */}
        <div className="mb-2">Edit your <a href="/dashboard" className="text-blue-600 underline">profile</a> and <a href="/dashboard" className="text-blue-600 underline">profile photo</a>.</div>
      </section>

      {/* Account Management */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Account Management</h2>
        <div className="flex flex-col gap-2">
          <button
            className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 text-left"
            onClick={handleDownloadData}
            disabled={downloading}
          >
            {downloading ? "Preparing your data..." : "Download my data"}
          </button>
          <button
            className="px-4 py-2 bg-red-100 rounded hover:bg-red-200 text-red-700 text-left"
            onClick={handleDeleteAccount}
            disabled={deleting}
          >
            {deleting ? "Deleting account..." : "Delete my account"}
          </button>
        </div>
      </section>

      {/* Notifications */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Notifications</h2>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={emailNotifications} onChange={e => setEmailNotifications(e.target.checked)} />
            Email notifications
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={pushNotifications} onChange={e => setPushNotifications(e.target.checked)} />
            Push notifications
          </label>
        </div>
      </section>

      {/* Preferences */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Preferences</h2>
        <div className="flex flex-col gap-2 mb-2">
          <label className="block">Theme
            <select className="ml-2 border rounded p-1" value={theme} onChange={e => setTheme(e.target.value)}>
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
          <label className="block">Language
            <select className="ml-2 border rounded p-1" value={language} onChange={e => setLanguage(e.target.value)}>
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              {/* Add more languages as needed */}
            </select>
          </label>
        </div>
      </section>

      {/* Privacy Controls */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Privacy Controls</h2>
        <div className="flex flex-col gap-2 mb-2">
          <label className="block">Profile visibility
            <select className="ml-2 border rounded p-1" value={profileVisibility} onChange={e => setProfileVisibility(e.target.value)}>
              <option value="public">Public</option>
              <option value="connections">Connections only</option>
              <option value="private">Private</option>
            </select>
          </label>
          <label className="block">Who can message me
            <select className="ml-2 border rounded p-1" value={canMessage} onChange={e => setCanMessage(e.target.value)}>
              <option value="everyone">Everyone</option>
              <option value="connections">Connections only</option>
              <option value="noone">No one</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={showOnline} onChange={e => setShowOnline(e.target.checked)} />
            Show my online status
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={showLastSeen} onChange={e => setShowLastSeen(e.target.checked)} />
            Show my last seen
          </label>
        </div>
      </section>

      {/* Security */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Security</h2>
        <div className="mb-2">Change your <a href="/password-recovery" className="text-blue-600 underline">password</a>.</div>
        {/* Two-factor authentication (2FA) placeholder */}
        <div className="mb-2">Two-factor authentication: <span className="italic text-gray-500">Coming soon</span></div>
      </section>

      {/* Legal */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Legal</h2>
        <div className="mb-2"><a href="/privacy" className="text-blue-600 underline">Privacy Policy</a></div>
        <div className="mb-2"><span className="text-gray-400">Terms of Service (coming soon)</span></div>
      </section>
    </div>
  );
} 