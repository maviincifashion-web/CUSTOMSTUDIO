/**
 * Fallback client config when `expo.extra.firebase` is missing (dev cache / old manifest).
 * Same project as SUITS_WEBSITE — keep in sync with app.config.js resolveFirebaseExtra().
 */
export const DEFAULT_FIREBASE_CLIENT = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
};
