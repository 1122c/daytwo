import 'dotenv/config';
import { db } from '@/services/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { sampleUserProfiles } from '@/services/websocketService';

async function uploadProfiles() {
  for (const profile of sampleUserProfiles) {
    try {
      await addDoc(collection(db, 'profiles'), profile);
      console.log(`Uploaded profile: ${profile.name}`);
    } catch (err) {
      console.error(`Failed to upload profile: ${profile.name}`, err);
    }
  }
  console.log('Done uploading sample profiles.');
}

uploadProfiles(); 