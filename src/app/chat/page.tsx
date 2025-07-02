"use client";
import { useEffect, useState } from 'react';
import { auth, db } from '@/services/firebase';
import { User } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { 
  listenToUserConversations, 
  listenToMessages, 
  sendMessage,
  createConversation,
  type Conversation,
  type Message 
} from '@/services/chatService';
import type { UserProfile } from '@/services/websocketService';

export default function ChatPage() {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const [iceBreakers, setIceBreakers] = useState<string[]>([]);
  const [iceBreakersLoading, setIceBreakersLoading] = useState(false);
  const [iceBreakersError, setIceBreakersError] = useState('');
  const [starters, setStarters] = useState<string[]>([]);
  const [startersLoading, setStartersLoading] = useState(false);
  const [startersError, setStartersError] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => setAuthUser(user));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchUsers() {
      const snap = await getDocs(collection(db, 'profiles'));
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile)));
    }
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!authUser) return;
    
    const unsubscribe = listenToUserConversations(authUser.uid, (conversations) => {
      setConversations(conversations);
    });
    
    return () => unsubscribe();
  }, [authUser]);

  // Handle URL parameter for auto-selecting conversation
  useEffect(() => {
    if (!authUser || !users.length) return;
    const targetUserId = searchParams?.get('user');
    if (!targetUserId) return;

    // Find existing conversation with this user
    const existingConversation = conversations.find(conv =>
      conv.participants.includes(targetUserId)
    );

    if (existingConversation) {
      setSelectedConversation(existingConversation.id);
    } else {
      // Always create/select conversation if not found
      createConversation(authUser.uid, targetUserId).then(conversationId => {
        setSelectedConversation(conversationId);
      });
    }
  }, [authUser, users, conversations, searchParams]);

  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }
    
    const unsubscribe = listenToMessages(selectedConversation, (messages) => {
      setMessages(messages);
    });
    
    return () => unsubscribe();
  }, [selectedConversation]);

  // Remove the useEffect that automatically fetches prompts
  // Add button handlers to fetch ice breakers and conversation starters on demand
  const handleGenerateIceBreakers = async () => {
    setIceBreakers([]);
    setIceBreakersError('');
    if (!authUser || !selectedConversation) return;
    const conversation = conversations.find(c => c.id === selectedConversation);
    if (!conversation) return;
    const otherUserId = conversation.participants.find(id => id !== authUser.uid);
    if (!otherUserId) return;
    const selfProfile = users.find(u => u.id === authUser.uid);
    const otherProfile = users.find(u => u.id === otherUserId);
    if (!selfProfile || !otherProfile) return;
    try {
      setIceBreakersLoading(true);
      const idToken = await authUser.getIdToken();
      const res = await fetch('/api/ice-breakers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ userProfile: selfProfile, matchProfile: otherProfile }),
      });
      const data = await res.json();
      setIceBreakers(data.activities || []);
    } catch {
      setIceBreakersError('Failed to fetch ice breakers.');
    } finally {
      setIceBreakersLoading(false);
    }
  };

  const handleGenerateStarters = async () => {
    setStarters([]);
    setStartersError('');
    if (!authUser || !selectedConversation) return;
    const conversation = conversations.find(c => c.id === selectedConversation);
    if (!conversation) return;
    const otherUserId = conversation.participants.find(id => id !== authUser.uid);
    if (!otherUserId) return;
    const selfProfile = users.find(u => u.id === authUser.uid);
    const otherProfile = users.find(u => u.id === otherUserId);
    if (!selfProfile || !otherProfile) return;
    try {
      setStartersLoading(true);
      const idToken = await authUser.getIdToken();
      const res = await fetch('/api/conversation-starters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ userProfile: selfProfile, matchProfile: otherProfile }),
      });
      const data = await res.json();
      setStarters(data.starters || []);
    } catch {
      setStartersError('Failed to fetch conversation starters.');
    } finally {
      setStartersLoading(false);
    }
  };

  async function handleSendMessage() {
    if (!authUser || !selectedConversation || !newMessage.trim()) return;
    
    setLoading(true);
    try {
      const conversation = conversations.find(c => c.id === selectedConversation);
      if (!conversation) return;
      
      const otherUserId = conversation.participants.find(id => id !== authUser.uid);
      if (!otherUserId) return;
      
      await sendMessage(authUser.uid, otherUserId, newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  }

  function getOtherParticipantName(conversation: Conversation): string {
    if (!authUser) return 'Unknown';
    const otherUserId = conversation.participants.find(id => id !== authUser.uid);
    const otherUser = users.find(u => u.id === otherUserId);
    return otherUser?.name || 'Unknown User';
  }

  if (!authUser) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded shadow p-8 mt-8">
        <h1 className="text-2xl font-bold mb-4">Chat</h1>
        <p className="text-gray-600">Please log in to start chatting.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded shadow p-8 mt-8">
      <h1 className="text-2xl font-bold mb-6">Chat</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Conversations List */}
        <div className="md:col-span-1">
          <h2 className="text-lg font-semibold mb-3">Conversations</h2>
          {conversations.length === 0 ? (
            <p className="text-gray-500">No conversations yet.</p>
          ) : (
            <div className="space-y-2">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  className={`w-full text-left p-3 rounded border ${
                    selectedConversation === conversation.id 
                      ? 'bg-blue-50 border-blue-300' 
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                  onClick={() => setSelectedConversation(conversation.id)}
                >
                  <div className="font-medium">{getOtherParticipantName(conversation)}</div>
                  {conversation.lastMessage && (
                    <div className="text-sm text-gray-600 truncate">
                      {conversation.lastMessage}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="md:col-span-2">
          {selectedConversation ? (
            <div className="h-96 flex flex-col">
              {/* Messages Display */}
              <div className="flex-1 overflow-y-auto border rounded p-4 mb-4 bg-gray-50">
                {messages.length === 0 ? (
                  <p className="text-gray-500 text-center">No messages yet. Start the conversation!</p>
                ) : (
                  <div className="space-y-3">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderId === authUser.uid ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs p-3 rounded-lg ${
                            message.senderId === authUser.uid
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border'
                          }`}
                        >
                          <div className="text-sm">{message.content}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 border rounded px-3 py-2"
                  disabled={loading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={loading || !newMessage.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          ) : (
            <div className="h-96 flex items-center justify-center border rounded bg-gray-50">
              <p className="text-gray-500">Select a conversation to start chatting.</p>
            </div>
          )}
        </div>

        {/* Prompts Sidebar */}
        <div className="md:col-span-1">
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Prompts</h2>
            <div className="mb-2">
              <span className="font-semibold text-blue-700">🧊 Ice Breakers</span>
              {iceBreakers.length === 0 ? (
                <button
                  className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                  onClick={handleGenerateIceBreakers}
                  disabled={iceBreakersLoading || !selectedConversation}
                >
                  {iceBreakersLoading ? 'Loading...' : 'Generate Ice Breakers'}
                </button>
              ) : null}
              {iceBreakersError && <div className="text-red-600 text-sm mt-2">{iceBreakersError}</div>}
              {iceBreakers.length > 0 && (
                <>
                  <ul className="mt-1 text-sm bg-blue-50 rounded p-2">
                    {iceBreakers.map((q, i) => (
                      <li key={i} className="mb-1 flex items-center gap-2">
                        <span>🎲 {q}</span>
                        <button
                          className="text-xs text-blue-600 underline"
                          onClick={() => setNewMessage(q)}
                          title="Copy to message input"
                        >
                          Use
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    className="mt-2 px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs"
                    onClick={handleGenerateIceBreakers}
                    disabled={iceBreakersLoading || !selectedConversation}
                  >
                    {iceBreakersLoading ? 'Loading...' : 'Click again for new ideas'}
                  </button>
                </>
              )}
            </div>
            <div className="mb-2">
              <span className="font-semibold text-green-700">💬 Conversation Starters</span>
              {starters.length === 0 ? (
                <button
                  className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded text-xs"
                  onClick={handleGenerateStarters}
                  disabled={startersLoading || !selectedConversation}
                >
                  {startersLoading ? 'Loading...' : 'Generate Conversation Starters'}
                </button>
              ) : null}
              {startersError && <div className="text-red-600 text-sm mt-2">{startersError}</div>}
              {starters.length > 0 && (
                <>
                  <ul className="mt-1 text-sm bg-green-50 rounded p-2">
                    {starters.map((q, i) => (
                      <li key={i} className="mb-1 flex items-center gap-2">
                        <span>💡 {q}</span>
                        <button
                          className="text-xs text-green-700 underline"
                          onClick={() => setNewMessage(q)}
                          title="Copy to message input"
                        >
                          Use
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    className="mt-2 px-2 py-1 bg-green-200 text-green-800 rounded text-xs"
                    onClick={handleGenerateStarters}
                    disabled={startersLoading || !selectedConversation}
                  >
                    {startersLoading ? 'Loading...' : 'Click again for new ideas'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 