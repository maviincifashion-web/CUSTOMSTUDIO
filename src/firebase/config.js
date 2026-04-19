import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import Constants from 'expo-constants';

// Agar aapke paas clientDefaults.ts file nahi hai toh aap ise hata sakte hain
// import { DEFAULT_FIREBASE_CLIENT } from './clientDefaults';

function getExpoExtra() {
  const ex =
    Constants.expoConfig?.extra ??
    Constants.manifest2?.extra?.expoClient?.extra ??
    Constants.manifest2?.extra ??
    Constants.manifest?.extra;
  return ex ?? {};
}

export function getFirebaseConfigFromEnv() {
  const f = getExpoExtra().firebase ?? {};
  console.log('[Firebase] Extra config from app.config:', f);
  if (f.apiKey && f.projectId) {
    return {
      ...f,
      databaseURL: f.databaseURL ?? process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL
    };
  }
  console.log('[Firebase] Using fallback config');
  return {}; // DEFAULT_FIREBASE_CLIENT ki jagah empty object
}

export function isFirebaseConfigured() {
  const c = getFirebaseConfigFromEnv();
  return Boolean(c.apiKey && c.projectId);
}

export function getFirebaseApp() {
  const cfg = getFirebaseConfigFromEnv();
  if (!cfg.apiKey || !cfg.projectId) return null;
  if (getApps().length) return getApps()[0];
  return initializeApp(cfg);
}

export function getFirestoreDb() {
  const app = getFirebaseApp();
  if (!app) return null;
  return getFirestore(app);
}

export function getRealtimeDb() {
  const app = getFirebaseApp();
  if (!app) {
    console.error('[Firebase] Cannot init Realtime DB - App not initialized');
    return null;
  }
  const cfg = getFirebaseConfigFromEnv();

  let dbUrl = cfg.databaseURL;
  if (!dbUrl) {
    dbUrl = `https://${cfg.projectId}-default-rtdb.asia-southeast1.firebasedatabase.app`;
    console.log('[Firebase] Trying default URL:', dbUrl);
  }
  return getDatabase(app, dbUrl);
}