import { db } from '@/services/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  doc,
  getDoc,
  setDoc,
  Timestamp
} from 'firebase/firestore';

export interface Message {
  id?: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Timestamp; // Firestore timestamp
  conversationId: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageTime?: Timestamp;
  createdAt: Timestamp;
}

/**
 * Create a conversation between two users
 */
export async function createConversation(user1Id: string, user2Id: string): Promise<string> {
  const participants = [user1Id, user2Id].sort(); // Sort for consistent conversationId
  const conversationId = participants.join('_');
  
  const conversationRef = doc(db, 'conversations', conversationId);
  const conversationDoc = await getDoc(conversationRef);
  
  if (!conversationDoc.exists()) {
    await setDoc(conversationRef, {
      participants,
      createdAt: serverTimestamp(),
    });
  }
  
  return conversationId;
}

/**
 * Send a message between two users
 */
export async function sendMessage(
  senderId: string, 
  receiverId: string, 
  content: string
): Promise<string> {
  // Create or get conversation
  const conversationId = await createConversation(senderId, receiverId);
  
  // Add message to Firestore
  const messageData = {
    senderId,
    receiverId,
    content,
    timestamp: serverTimestamp(),
    conversationId,
  };
  
  const docRef = await addDoc(collection(db, 'messages'), messageData);
  
  // Update conversation with last message
  const conversationRef = doc(db, 'conversations', conversationId);
  await setDoc(conversationRef, {
    lastMessage: content,
    lastMessageTime: serverTimestamp(),
  }, { merge: true });
  
  return docRef.id;
}

/**
 * Get messages for a conversation (one-time fetch)
 */
export async function getMessages(conversationId: string): Promise<Message[]> {
  const messagesQuery = query(
    collection(db, 'messages'),
    where('conversationId', '==', conversationId),
    orderBy('timestamp', 'asc')
  );
  
  return new Promise((resolve, reject) => {
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messages: Message[] = [];
      snapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() } as Message);
      });
      resolve(messages);
      unsubscribe(); // Stop listening after first fetch
    }, reject);
  });
}

/**
 * Listen to messages in real-time for a conversation
 */
export function listenToMessages(
  conversationId: string, 
  callback: (messages: Message[]) => void
): () => void {
  const messagesQuery = query(
    collection(db, 'messages'),
    where('conversationId', '==', conversationId),
    orderBy('timestamp', 'asc')
  );
  
  return onSnapshot(messagesQuery, (snapshot) => {
    const messages: Message[] = [];
    snapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() } as Message);
    });
    callback(messages);
  });
}

/**
 * Get all conversations for a user
 */
export function listenToUserConversations(
  userId: string,
  callback: (conversations: Conversation[]) => void
): () => void {
  const conversationsQuery = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', userId)
  );
  
  return onSnapshot(conversationsQuery, (snapshot) => {
    const conversations: Conversation[] = [];
    snapshot.forEach((doc) => {
      conversations.push({ id: doc.id, ...doc.data() } as Conversation);
    });
    // Sort by last message time in memory (most recent first)
    conversations.sort((a, b) => {
      if (!a.lastMessageTime && !b.lastMessageTime) return 0;
      if (!a.lastMessageTime) return 1;
      if (!b.lastMessageTime) return -1;
      return b.lastMessageTime.toMillis() - a.lastMessageTime.toMillis();
    });
    callback(conversations);
  });
}

/**
 * Get conversation details by ID
 */
export async function getConversation(conversationId: string): Promise<Conversation | null> {
  const conversationDoc = await getDoc(doc(db, 'conversations', conversationId));
  if (conversationDoc.exists()) {
    return { id: conversationDoc.id, ...conversationDoc.data() } as Conversation;
  }
  return null;
} 