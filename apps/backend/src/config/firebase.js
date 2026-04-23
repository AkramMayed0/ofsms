/**
 * firebase.js — OFSMS Firebase Admin SDK Initializer
 *
 * Initializes the Firebase Admin app once at process start.
 * Credentials are loaded from the GOOGLE_APPLICATION_CREDENTIALS env var
 * (path to a service account JSON file) OR from individual env vars
 * for environments where file-based secrets aren't practical (e.g. Docker).
 *
 * Usage:
 *   const { admin, messaging } = require('./firebase');
 *   await messaging.send({ token, notification: { title, body } });
 */

const admin = require('firebase-admin');

let app;

const initFirebase = () => {
  if (admin.apps.length > 0) {
    // Already initialized — return the existing app
    return admin.apps[0];
  }

  // Option A: GOOGLE_APPLICATION_CREDENTIALS env var points to service account JSON
  // Option B: Inline service account fields via individual env vars
  const useInlineCredentials =
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_PRIVATE_KEY &&
    process.env.FIREBASE_CLIENT_EMAIL;

  if (useInlineCredentials) {
    app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId:   process.env.FIREBASE_PROJECT_ID,
        privateKey:  process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Let the SDK auto-load from the file path
    app = admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } else {
    throw new Error(
      '[Firebase] Missing credentials. Set FIREBASE_PROJECT_ID + FIREBASE_PRIVATE_KEY + ' +
      'FIREBASE_CLIENT_EMAIL, or set GOOGLE_APPLICATION_CREDENTIALS to a service account file path.'
    );
  }

  // eslint-disable-next-line no-console
  console.log('[Firebase] Admin SDK initialized for project:', process.env.FIREBASE_PROJECT_ID);
  return app;
};

// Initialize immediately when this module is required
initFirebase();

module.exports = {
  admin,
  messaging: admin.messaging(),
};
