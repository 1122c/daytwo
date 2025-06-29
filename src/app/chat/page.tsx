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
  }, [authUser, users, searchParams]);

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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      </div>
    </div>
  );
} 