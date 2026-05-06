import { registerAs } from '@nestjs/config';

/**
 * Firebase configuration.
 *
 * Environment variables:
 * - FIREBASE_PROJECT_ID: Firebase project ID
 * - FIREBASE_PRIVATE_KEY: Service account private key (with escaped newlines)
 * - FIREBASE_CLIENT_EMAIL: Service account client email
 */
export default registerAs('firebase', () => ({
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
}));
