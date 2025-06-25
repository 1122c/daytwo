// src/services/testMatchExplanation.ts

// Load environment variables first
import * as dotenv from 'dotenv';
dotenv.config();

// Now import other modules
import { sampleUserProfiles, generateMatchExplanation, UserProfile } from './websocketService';

async function testMatch() {
  // Debug: check if API key is loaded
  console.log('API Key loaded:', process.env.OPENAI_API_KEY ? 'Yes' : 'No');
  
  // Test with the first two profiles
  const profilesToMatch = sampleUserProfiles.slice(0, 2);
  console.log('Matching profiles:');
  profilesToMatch.forEach((p: UserProfile) => {
    console.log(`- ${p.name}`);
  });

  try {
    const explanation = await generateMatchExplanation(profilesToMatch);
    console.log('\nMatch Explanation:\n', explanation);
  } catch (error) {
    console.error('Error generating match explanation:', error);
  }
}

testMatch();

