import React, { createContext, useContext, useState, useCallback } from 'react';
import { ref, onValue, off, update, serverTimestamp } from 'firebase/database';
import { getRealtimeDb } from '../firebase/config';

// Custom ID generator to avoid crypto/uuid issues in Expo/TV environments
const generateSessionId = () => {
    return Math.random().toString(36).substring(2, 10) + Date.now().toString(36).substring(4);
};

const stripUndefinedDeep = (value: any): any => {
  if (Array.isArray(value)) {
    return value.map(stripUndefinedDeep);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, nestedValue]) => nestedValue !== undefined)
        .map(([key, nestedValue]) => [key, stripUndefinedDeep(nestedValue)])
    );
  }

  return value;
};

export interface RemoteCommand {
  type: string;
  payload: any;
  timestamp: number;
  id: string;
  source: 'mobile' | 'tv';
}

interface SessionMeta {
  sessionId: string;
  mobileConnected: boolean;
  mobileConnectedAt?: object | number | null;
  timestamp: number;
}

interface RemoteControlContextType {
  tvSessionId: string | null;
  isTVMode: boolean;
  generateQRCode: () => string;
  startTVSession: () => Promise<string>;
  joinTVSession: (sessionId: string) => Promise<void>;
  sendCommand: (type: string, payload?: any) => Promise<void>;
  subscribeToCommands: (callback: (command: RemoteCommand) => void) => () => void;
  subscribeToSession: (callback: (meta: SessionMeta) => void) => () => void;
  endSession: () => void;
}

const RemoteControlContext = createContext<RemoteControlContextType | null>(null);

export const useRemoteControl = () => {
  const context = useContext(RemoteControlContext);
  if (!context) {
    throw new Error('useRemoteControl must be used within RemoteControlProvider');
  }
  return context;
};

export const RemoteControlProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tvSessionId, setTvSessionId] = useState<string | null>(null);
  const [isTVMode, setIsTVMode] = useState(false);
  const db = getRealtimeDb();

  const generateQRCode = useCallback(() => {
    if (!tvSessionId) return '';
    const qrData = {
      sessionId: tvSessionId,
      type: 'tv-remote',
      url: `maviinciapp://tv-remote?sessionId=${tvSessionId}`,
    };
    return JSON.stringify(qrData);
  }, [tvSessionId]);

  const startTVSession = useCallback(async () => {
    console.log('[RemoteControl] Starting TV Session...');
    if (!db) {
      console.error('[RemoteControl] startTVSession failed: db is null');
      throw new Error('Firebase not configured');
    }

    try {
      const sessionId = generateSessionId();
      const sessionRef = ref(db, `tv-sessions/${sessionId}`);

      const sessionData = {
        sessionId,
        mobileConnected: false,
        mobileConnectedAt: null,
        timestamp: Date.now(),
      };

      console.log('[RemoteControl] Creating session in Firebase:', sessionId);

      // Use a timeout for the update promise
      const updatePromise = update(sessionRef, sessionData);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Firebase Connection Timeout: Please check your Realtime Database Rules and URL.')), 10000)
      );

      await Promise.race([updatePromise, timeoutPromise]);
      console.log('[RemoteControl] Session created successfully');

      setTvSessionId(sessionId);
      setIsTVMode(true);

      return sessionId;
    } catch (error) {
      console.error('[RemoteControl] Failed to create session in Firebase:', error);
      throw error;
    }
  }, [db]);

  const joinTVSession = useCallback(async (sessionId: string) => {
    if (!db) throw new Error('Firebase not configured');

    const sessionRef = ref(db, `tv-sessions/${sessionId}`);
    await update(sessionRef, {
      mobileConnected: true,
      mobileConnectedAt: serverTimestamp(),
      timestamp: serverTimestamp(),
    });

    setTvSessionId(sessionId);
    setIsTVMode(false); // Mobile mode
  }, [db]);

  const sendCommand = useCallback(async (type: string, payload: any = {}) => {
    if (!db || !tvSessionId) return;

    const commandRef = ref(db, `tv-sessions/${tvSessionId}/command`);
    const command = {
      type,
      payload: stripUndefinedDeep(payload),
      timestamp: Date.now(),
      id: generateSessionId(),
      source: isTVMode ? 'tv' : 'mobile',
    };
    await update(commandRef, command);
  }, [db, tvSessionId, isTVMode]);

  const subscribeToCommands = useCallback((callback: (command: RemoteCommand) => void) => {
    if (!db || !tvSessionId) return () => {};

    const commandRef = ref(db, `tv-sessions/${tvSessionId}/command`);
    let skipFirst = true;

    const listener = onValue(commandRef, (snapshot) => {
      if (skipFirst) { skipFirst = false; return; }
      if (snapshot.exists()) {
        const command = snapshot.val();
        const mySource = isTVMode ? 'tv' : 'mobile';
        if (command.source !== mySource) {
          callback(command);
        }
      }
    });

    return () => off(commandRef, 'value', listener);
  }, [db, tvSessionId, isTVMode]);

  const subscribeToSession = useCallback((callback: (meta: SessionMeta) => void) => {
    if (!db || !tvSessionId) return () => {};

    const sessionRef = ref(db, `tv-sessions/${tvSessionId}`);
    const listener = onValue(sessionRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      }
    });

    return () => off(sessionRef, 'value', listener);
  }, [db, tvSessionId]);

  const endSession = useCallback(() => {
    setTvSessionId(null);
    setIsTVMode(false);
  }, []);

  return (
    <RemoteControlContext.Provider
      value={{
        tvSessionId,
        isTVMode,
        generateQRCode,
        startTVSession,
        joinTVSession,
        sendCommand,
        subscribeToCommands,
        subscribeToSession,
        endSession,
      }}
    >
      {children}
    </RemoteControlContext.Provider>
  );
};