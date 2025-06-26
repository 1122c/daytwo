// ConversationService: Handles creation and retrieval of conversations.
// Start small: 1:1 conversations only. Expand to group chat, metadata, etc. later.

import { db } from '@/services/firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

export interface Conversation {
  id?: string;
  participants: string[]; // user UIDs
  createdAt: Date;
  // Add more metadata as needed (e.g., lastMessage, isGroup, title)
}

// Create a new 1:1 conversation
export async function createConversation(participantIds: string[]): Promise<string> {
  const docRef = await addDoc(collection(db, 'conversations'), {
    participants: participantIds,
    createdAt: new Date(),
  });
  return docRef.id;
}

// Fetch all conversations for a user
export async function getUserConversations(userId: string): Promise<Conversation[]> {
  const q = query(collection(db, 'conversations'), where('participants', 'array-contains', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
}

// TODO: Add group chat, conversation metadata, and participant management in the future. 