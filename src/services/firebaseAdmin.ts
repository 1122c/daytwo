import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    // Optionally add databaseURL if needed
  });
}

export const adminAuth = admin.auth();
export default admin; 