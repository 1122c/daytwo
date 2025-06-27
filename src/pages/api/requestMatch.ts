import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { adminAuth } from '@/services/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }
  const idToken = authHeader.split('Bearer ')[1];
  let fromUserId = '';
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    fromUserId = decoded.uid;
  } catch {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
  const { toUserId } = req.body;
  if (!toUserId || typeof toUserId !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid toUserId' });
  }
  try {
    await addDoc(collection(db, 'matchRequests'), {
      fromUserId,
      toUserId,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
    res.status(200).json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to create match request' });
  }
} 