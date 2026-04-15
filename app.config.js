const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const appJson = require('./app.json');

/** Same project as SUITS_WEBSITE — used only if EXPO_PUBLIC_* are missing (e.g. dotenv not applied). */
const DEFAULT_FIREBASE = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
};

function resolveFirebaseExtra() {
  const fromEnv = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
  };
  if (fromEnv.apiKey && fromEnv.projectId) {
    return fromEnv;
  }
  return DEFAULT_FIREBASE;
}

/** Merges `app.json` with env-driven Firebase config (EXPO_PUBLIC_*). */
module.exports = () => ({
  expo: {
    ...appJson.expo,
    extra: {
      ...(appJson.expo.extra || {}),
      firebase: resolveFirebaseExtra(),
    },
  },
});
