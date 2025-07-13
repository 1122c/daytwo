import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }
  const idToken = authHeader.split('Bearer ')[1];
  let uid: string;
  try {
    const decoded = await getAuth().verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
  const { targetUserId } = req.body;
  if (!targetUserId) {
    return res.status(400).json({ error: 'Missing targetUserId' });
  }
  try {
    // Find matchRequests in either direction with status 'accepted'
    const matchReqs = await db.collection('matchRequests')
      .where('status', '==', 'accepted')
      .where('fromUserId', 'in', [uid, targetUserId])
      .where('toUserId', 'in', [uid, targetUserId])
      .get();
    const batch = db.batch();
    matchReqs.forEach(docSnap => {
      batch.update(docSnap.ref, { status: 'unmatched', unmatchedAt: new Date() });
    });
    await batch.commit();
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to unmatch user' });
  }
} 