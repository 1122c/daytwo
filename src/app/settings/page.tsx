"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  
  // Existing state
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
  
  // New privacy states
  const [searchVisibility, setSearchVisibility] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [typingIndicators, setTypingIndicators] = useState(true);
  const [profileViewNotifications, setProfileViewNotifications] = useState(false);
  const [anonymousBrowsing, setAnonymousBrowsing] = useState(false);
  
  // Safety states
  const [messageRequests, setMessageRequests] = useState(true);
  const [locationSharing, setLocationSharing] = useState(false);
  const [contentFilter, setContentFilter] = useState("moderate");
  
  // Communication states
  const [voiceCallPermissions, setVoiceCallPermissions] = useState("connections");
  const [videoCallPermissions, setVideoCallPermissions] = useState("connections");
  const [messageRetention, setMessageRetention] = useState("forever");
  const [awayMessage, setAwayMessage] = useState("");
  const [awayMessageEnabled, setAwayMessageEnabled] = useState(false);
  
  // Discovery preferences - commented out for now
  // const [maxDistance, setMaxDistance] = useState(50);
  // const [ageRangeMin, setAgeRangeMin] = useState(18);
  // const [ageRangeMax, setAgeRangeMax] = useState(65);
  // const [interestMatching, setInterestMatching] = useState("balanced");
  
  // Accessibility states
  const [fontSize, setFontSize] = useState("medium");
  const [highContrast, setHighContrast] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  
  // Account states
  const [accountPaused, setAccountPaused] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Blocked users (mock data)
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);

  // Handlers
  const handleDownloadData = async () => {
    setDownloading(true);
    setTimeout(() => setDownloading(false), 2000);
  };
  
  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This cannot be undone.")) return;
    setDeleting(true);
    setTimeout(() => {
      setDeleting(false);
      router.push("/");
    }, 2000);
  };
  
  const handleUnblockUser = (username: string) => {
    setBlockedUsers(blockedUsers.filter(u => u !== username));
  };
  
  const handlePauseAccount = () => {
    setAccountPaused(!accountPaused);
    // TODO: Implement backend logic
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow mt-8 mb-16">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      {/* Account Status Alert */}
      {accountPaused && (
        <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 rounded-lg">
          <p className="text-yellow-800">Your account is currently paused. You won't appear in searches or receive new messages.</p>
        </div>
      )}

      {/* Profile Info */}
      <section className="mb-8 pb-8 border-b">
        <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
        <div className="space-y-2">
          <p>Edit your <a href="/dashboard" className="text-blue-600 hover:underline">profile</a> and <a href="/dashboard" className="text-blue-600 hover:underline">profile photo</a>.</p>
          <button className="text-blue-600 hover:underline text-sm">Verify your account →</button>
        </div>
      </section>

      {/* Privacy Controls */}
      <section className="mb-8 pb-8 border-b">
        <h2 className="text-xl font-semibold mb-4">Privacy Controls</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium">Profile visibility</span>
              <select className="mt-1 w-full border rounded-md p-2" value={profileVisibility} onChange={e => setProfileVisibility(e.target.value)}>
                <option value="public">Public</option>
                <option value="connections">Connections only</option>
                <option value="private">Private</option>
              </select>
            </label>
            
            <label className="block">
              <span className="text-sm font-medium">Who can message me</span>
              <select className="mt-1 w-full border rounded-md p-2" value={canMessage} onChange={e => setCanMessage(e.target.value)}>
                <option value="everyone">Everyone</option>
                <option value="connections">Connections only</option>
                <option value="noone">No one</option>
              </select>
            </label>
          </div>
          
          <div className="space-y-2">
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={showOnline} onChange={e => setShowOnline(e.target.checked)} className="rounded" />
              <span>Show my online status</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={showLastSeen} onChange={e => setShowLastSeen(e.target.checked)} className="rounded" />
              <span>Show my last seen</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={searchVisibility} onChange={e => setSearchVisibility(e.target.checked)} className="rounded" />
              <span>Appear in search results</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={readReceipts} onChange={e => setReadReceipts(e.target.checked)} className="rounded" />
              <span>Send read receipts</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={typingIndicators} onChange={e => setTypingIndicators(e.target.checked)} className="rounded" />
              <span>Show typing indicators</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={profileViewNotifications} onChange={e => setProfileViewNotifications(e.target.checked)} className="rounded" />
              <span>Notify me when someone views my profile</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={anonymousBrowsing} onChange={e => setAnonymousBrowsing(e.target.checked)} className="rounded" />
              <span>Browse profiles anonymously</span>
            </label>
          </div>
        </div>
      </section>

      {/* Communication Settings */}
      <section className="mb-8 pb-8 border-b">
        <h2 className="text-xl font-semibold mb-4">Communication Settings</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium">Voice calls from</span>
              <select className="mt-1 w-full border rounded-md p-2" value={voiceCallPermissions} onChange={e => setVoiceCallPermissions(e.target.value)}>
                <option value="everyone">Everyone</option>
                <option value="connections">Connections only</option>
                <option value="noone">No one</option>
              </select>
            </label>
            
            <label className="block">
              <span className="text-sm font-medium">Video calls from</span>
              <select className="mt-1 w-full border rounded-md p-2" value={videoCallPermissions} onChange={e => setVideoCallPermissions(e.target.value)}>
                <option value="everyone">Everyone</option>
                <option value="connections">Connections only</option>
                <option value="noone">No one</option>
              </select>
            </label>
          </div>
          
          <label className="block">
            <span className="text-sm font-medium">Message retention</span>
            <select className="mt-1 w-full border rounded-md p-2" value={messageRetention} onChange={e => setMessageRetention(e.target.value)}>
              <option value="forever">Keep forever</option>
              <option value="30days">Delete after 30 days</option>
              <option value="7days">Delete after 7 days</option>
              <option value="24hours">Delete after 24 hours</option>
            </select>
          </label>
          
          <div className="space-y-2">
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={messageRequests} onChange={e => setMessageRequests(e.target.checked)} className="rounded" />
              <span>Require approval for message requests</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={awayMessageEnabled} onChange={e => setAwayMessageEnabled(e.target.checked)} className="rounded" />
              <span>Enable away message</span>
            </label>
            {awayMessageEnabled && (
              <textarea
                className="w-full border rounded-md p-2 mt-2"
                rows={2}
                placeholder="I'm currently away and will respond when I return..."
                value={awayMessage}
                onChange={e => setAwayMessage(e.target.value)}
              />
            )}
          </div>
        </div>
      </section>

      {/* Discovery Preferences - commented out for now */}
      {/* <section className="mb-8 pb-8 border-b">
        <h2 className="text-xl font-semibold mb-4">Discovery Preferences</h2>
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium">Maximum distance: {maxDistance} miles</span>
            <input
              type="range"
              min="5"
              max="500"
              value={maxDistance}
              onChange={e => setMaxDistance(Number(e.target.value))}
              className="w-full mt-2"
            />
          </label>
          
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium">Minimum age</span>
              <input
                type="number"
                min="18"
                max="100"
                value={ageRangeMin}
                onChange={e => setAgeRangeMin(Number(e.target.value))}
                className="mt-1 w-full border rounded-md p-2"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Maximum age</span>
              <input
                type="number"
                min="18"
                max="100"
                value={ageRangeMax}
                onChange={e => setAgeRangeMax(Number(e.target.value))}
                className="mt-1 w-full border rounded-md p-2"
              />
            </label>
          </div>
          
          <label className="block">
            <span className="text-sm font-medium">Interest matching priority</span>
            <select className="mt-1 w-full border rounded-md p-2" value={interestMatching} onChange={e => setInterestMatching(e.target.value)}>
              <option value="low">Low - Show diverse connections</option>
              <option value="balanced">Balanced</option>
              <option value="high">High - Prioritize similar interests</option>
            </select>
          </label>
        </div>
      </section> */}

      {/* Safety & Security */}
      <section className="mb-8 pb-8 border-b">
        <h2 className="text-xl font-semibold mb-4">Safety & Security</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={locationSharing} onChange={e => setLocationSharing(e.target.checked)} className="rounded" />
              <span>Allow location sharing for in-person meetings</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={twoFactorEnabled} onChange={e => setTwoFactorEnabled(e.target.checked)} className="rounded" />
              <span>Enable two-factor authentication</span>
            </label>
          </div>
          
          <label className="block">
            <span className="text-sm font-medium">Content filtering</span>
            <select className="mt-1 w-full border rounded-md p-2" value={contentFilter} onChange={e => setContentFilter(e.target.value)}>
              <option value="none">None</option>
              <option value="moderate">Moderate</option>
              <option value="strict">Strict</option>
            </select>
          </label>
          
          <div>
            <h3 className="text-sm font-medium mb-2">Blocked users</h3>
            {blockedUsers.length === 0 ? (
              <p className="text-sm text-gray-500">No blocked users</p>
            ) : (
              <div className="space-y-1">
                {blockedUsers.map(user => (
                  <div key={user} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span>{user}</span>
                    <button
                      onClick={() => handleUnblockUser(user)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <a href="/safety-center" className="text-blue-600 hover:underline">Visit Safety Center →</a>
            <a href="/reports" className="text-blue-600 hover:underline">View report history →</a>
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="mb-8 pb-8 border-b">
        <h2 className="text-xl font-semibold mb-4">Notifications</h2>
        <div className="space-y-2">
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={emailNotifications} onChange={e => setEmailNotifications(e.target.checked)} className="rounded" />
            <span>Email notifications</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={pushNotifications} onChange={e => setPushNotifications(e.target.checked)} className="rounded" />
            <span>Push notifications</span>
          </label>
        </div>
      </section>

      {/* Accessibility */}
      <section className="mb-8 pb-8 border-b">
        <h2 className="text-xl font-semibold mb-4">Accessibility</h2>
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium">Font size</span>
            <select className="mt-1 w-full border rounded-md p-2" value={fontSize} onChange={e => setFontSize(e.target.value)}>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="extra-large">Extra Large</option>
            </select>
          </label>
          
          <div className="space-y-2">
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={highContrast} onChange={e => setHighContrast(e.target.checked)} className="rounded" />
              <span>High contrast mode</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={reduceMotion} onChange={e => setReduceMotion(e.target.checked)} className="rounded" />
              <span>Reduce motion</span>
            </label>
          </div>
        </div>
      </section>

      {/* Preferences */}
      <section className="mb-8 pb-8 border-b">
        <h2 className="text-xl font-semibold mb-4">Preferences</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium">Theme</span>
            <select className="mt-1 w-full border rounded-md p-2" value={theme} onChange={e => setTheme(e.target.value)}>
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium">Language</span>
            <select className="mt-1 w-full border rounded-md p-2" value={language} onChange={e => setLanguage(e.target.value)}>
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="it">Italian</option>
              <option value="pt">Portuguese</option>
              <option value="ja">Japanese</option>
              <option value="ko">Korean</option>
              <option value="zh">Chinese</option>
            </select>
          </label>
        </div>
      </section>

      {/* Account Management */}
      <section className="mb-8 pb-8 border-b">
        <h2 className="text-xl font-semibold mb-4">Account Management</h2>
        <div className="space-y-3">
          <button
            className="w-full md:w-auto px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 text-left"
            onClick={handlePauseAccount}
          >
            {accountPaused ? "Unpause account" : "Pause account"}
          </button>
          <button
            className="w-full md:w-auto px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 text-left"
            onClick={handleDownloadData}
            disabled={downloading}
          >
            {downloading ? "Preparing your data..." : "Download my data"}
          </button>
          <button
            className="w-full md:w-auto px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 text-left"
          >
            Export connections list
          </button>
          <a href="/sessions" className="block text-blue-600 hover:underline">
            Manage active sessions →
          </a>
          <a href="/login-history" className="block text-blue-600 hover:underline">
            View login history →
          </a>
          <button
            className="w-full md:w-auto px-4 py-2 bg-red-100 rounded-md hover:bg-red-200 text-red-700 text-left"
            onClick={handleDeleteAccount}
            disabled={deleting}
          >
            {deleting ? "Deleting account..." : "Delete my account"}
          </button>
        </div>
      </section>

      {/* Legal */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Legal</h2>
        <div className="space-y-2">
          <a href="/privacy" className="block text-blue-600 hover:underline">Privacy Policy</a>
          <a href="/terms" className="block text-blue-600 hover:underline">Terms of Service</a>
          <a href="/community-guidelines" className="block text-blue-600 hover:underline">Community Guidelines</a>
        </div>
      </section>
    </div>
  );
}
