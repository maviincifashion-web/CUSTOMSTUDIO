import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import Constants from 'expo-constants';
import { DEFAULT_FIREBASE_CLIENT } from './clientDefaults';

/** `extra` can live on expoConfig, legacy manifest, or manifest2 (Expo Go / dev). */
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
  if (f.apiKey && f.projectId) return f;
  return DEFAULT_FIREBASE_CLIENT;
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
