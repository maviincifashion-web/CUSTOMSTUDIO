import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, SafeAreaView, TouchableOpacity, Pressable, ScrollView, Platform } from 'react-native';

// D-pad focusable button — uses Pressable for native Android focus support
const FocusableButton = ({ style, focusStyle, children, onPress, ...props }: any) => {
    return (
        <Pressable
            focusable={true}
            accessible={true}
            accessibilityRole="button"
            onPress={onPress}
            style={({ focused, pressed }: any) => [
                style,
                focused && (focusStyle || tvFocusStyles.focusRing),
                pressed && tvFocusStyles.pressed,
            ]}
            {...props}
        >
            {children}
        </Pressable>
    );
};

const tvFocusStyles = StyleSheet.create({
    focusRing: {
        borderWidth: 4,
        borderColor: '#FFD700',
        backgroundColor: 'rgba(255, 215, 0, 0.15)',
        elevation: 15,
        transform: [{ scale: 1.08 }],
    },
    pressed: {
        opacity: 0.7,
        transform: [{ scale: 0.96 }],
    },
});
import QRCode from 'react-native-qrcode-svg';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useRemoteControl } from '../src/context/RemoteControlContext';
import { useResponsive } from '../hooks/useResponsive';
import KurtaMain from '../src/customizers/Kurta/KurtaMain';
import OutfitScreen from './(tabs)/outfit';

export default function TVScreen() {
  const { width, height, normalize, isTV } = useResponsive();
  // Larger QR for 4K screens (43" vertical)
  const qrSize = isTV ? normalize(320) : Math.min(280, Math.min(width, height) * 0.4);
  const { startTVSession, tvSessionId, subscribeToSession, subscribeToCommands, sendCommand } = useRemoteControl();
  const [isConnected, setIsConnected] = useState(false);
  const [qrValue, setQrValue] = useState('');
  const [initError, setInitError] = useState<string | null>(null);
  const [currentScreen, setCurrentScreen] = useState<'outfit' | 'kurta'>('outfit');

  // On TV, don't lock orientation — ADB user_rotation handles it.
  // Locking PORTRAIT_UP on a rotated TV causes letterboxing (app renders in ~30% of screen).
  useEffect(() => {
    // For the vertical TV setup, we want to stay in PORTRAIT_UP
    // but we allow the system to handle the rotation if it's already set to vertical.
    if (!isTV) {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    } else {
      // On vertical TV, specific lock might be needed if it auto-rotates to landscape
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    }
  }, [isTV]);

  useEffect(() => {
    const initSession = async () => {
      try {
        setInitError(null);
        console.log('[TV] Initializing session...');
        const id = await startTVSession();
        console.log('[TV] Session started successfully:', id);
      } catch (error: any) {
        console.error('[TV] Failed to start session:', error);
        setInitError(error?.message || String(error));
      }
    };
    initSession();
  }, [startTVSession]);

  useEffect(() => {
    setIsConnected(false);
    setQrValue('');
    if (tvSessionId) {
      const qrData = JSON.stringify({
        sessionId: tvSessionId,
        type: 'tv-remote',
        url: `maviinciapp://tv-remote?sessionId=${tvSessionId}`,
      });
      setQrValue(qrData);
    }
  }, [tvSessionId]);

  // Listen for mobile connection status
  useEffect(() => {
    if (!tvSessionId) return;
    const unsubscribe = subscribeToSession((meta) => {
      setIsConnected(Boolean(meta.mobileConnected));
    });
    return unsubscribe;
  }, [tvSessionId, subscribeToSession]);

  // Listen for NAVIGATE commands from phone
  useEffect(() => {
    if (!tvSessionId) return;
    const unsubscribe = subscribeToCommands((cmd) => {
      if (cmd.type === 'NAVIGATE') {
        setCurrentScreen(cmd.payload.screen === 'kurta' ? 'kurta' : 'outfit');
      }
    });
    return unsubscribe;
  }, [tvSessionId, subscribeToCommands]);

  // Callback for child components to navigate (TV mouse clicks)
  const handleNavigate = useCallback((screen: 'outfit' | 'kurta') => {
    setCurrentScreen(screen);
    sendCommand('NAVIGATE', { screen });
  }, [sendCommand]);

  return (
    <View style={styles.fullScreen}>
      {isConnected ? (
        currentScreen === 'kurta' ? <KurtaMain isTVView={true} initialPanel="Fabric" onNavigate={handleNavigate} /> : <OutfitScreen isTVView={true} onNavigate={handleNavigate} />
      ) : null}

      {!isConnected ? (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
        <Text style={[styles.brandTitle, { fontSize: normalize(36), letterSpacing: normalize(8) }]}>MAVIINCI</Text>
        <Text style={[styles.brandSub, { fontSize: normalize(15), letterSpacing: normalize(3) }]}>Bespoke Tailoring</Text>

        {initError && (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>⚠️ Connection Error</Text>
            <ScrollView style={styles.errorScroll}>
              <Text style={styles.errorText}>{initError}</Text>
            </ScrollView>
            <FocusableButton
              style={styles.retryBtn}
              onPress={async () => {
                setInitError(null);
                try {
                  await startTVSession({});
                } catch (e: any) {
                  setInitError(e?.message || String(e));
                }
              }}
            >
              <Text style={styles.retryBtnText}>RETRY</Text>
            </FocusableButton>
          </View>
        )}

        {!initError && (
          <>
            <View style={[styles.qrCard, { padding: normalize(30), borderRadius: normalize(28) }]}>
              <Text style={[styles.qrLabel, { fontSize: normalize(20), marginBottom: normalize(20) }]}>📱 Scan to Control</Text>
              <View style={[styles.qrBox, { width: qrSize + 40, height: qrSize + 40, padding: normalize(16), borderRadius: normalize(20) }]}>
                {qrValue ? (
                  <QRCode value={qrValue} size={qrSize} />
                ) : (
                  <View style={{ alignItems: 'center' }}>
                    <Text style={styles.loadingText}>Connecting to Firebase…</Text>
                    <Text style={[styles.qrHint, { color: '#ffcc00', marginTop: 30 }]}>
                      Stuck here? Please check Firebase Rules.
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.qrHint, { fontSize: normalize(14), lineHeight: normalize(22), marginTop: normalize(20) }]}>
                Open MaviinciApp on your phone{'\n'}and tap &quot;Scan TV QR&quot; to connect
              </Text>
            </View>

            <View style={[styles.statusBadge, { marginTop: normalize(30), paddingHorizontal: normalize(20), paddingVertical: normalize(10) }]}>
              <View style={[styles.statusDot, isConnected && { backgroundColor: '#00ff00' }]} />
              <Text style={[styles.statusText, { fontSize: normalize(15) }]}>
                {isConnected ? 'Connected to mobile!' : 'Waiting for mobile…'}
              </Text>
            </View>
          </>
        )}

        {tvSessionId && !initError ? (
          <Text style={styles.sessionText}>Session ID: {tvSessionId.slice(0, 8)}</Text>
        ) : null}
          </View>
        </SafeAreaView>
      ) : null}

      {isConnected ? (
        <FocusableButton
          style={styles.disconnectBtn}
          onPress={() => setIsConnected(false)}
        >
          <Text style={styles.disconnectText}>RESET CONNECTION</Text>
        </FocusableButton>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  fullScreen: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  brandTitle: { color: '#ffffff', fontSize: 36, fontWeight: '900', letterSpacing: 8, marginBottom: 4 },
  brandSub: { color: '#888', fontSize: 15, letterSpacing: 3, marginBottom: 40 },
  errorCard: { backgroundColor: '#2a0a0a', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#ff4444', width: '100%', maxWidth: 500, alignItems: 'center' },
  errorTitle: { color: '#ff4444', fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  errorScroll: { maxHeight: 150, width: '100%', marginBottom: 20 },
  errorText: { color: '#ffaaaa', fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', textAlign: 'center' },
  retryBtn: { backgroundColor: '#ff4444', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 10 },
  retryBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  qrCard: { backgroundColor: '#151515', borderRadius: 28, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: '#2a2a2a', width: '100%', maxWidth: 400 },
  qrLabel: { color: '#ffffff', fontSize: 20, fontWeight: '700', marginBottom: 20 },
  qrBox: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff', padding: 16, borderRadius: 20 },
  loadingText: { color: '#222', fontSize: 14 },
  qrHint: { marginTop: 20, color: '#999', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 30, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333' },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#555', marginRight: 10 },
  statusText: { color: '#888', fontSize: 15, fontWeight: '600' },
  sessionText: { marginTop: 12, color: '#555', fontSize: 12 },
  disconnectBtn: { position: 'absolute', bottom: 20, left: 20, padding: 10, backgroundColor: 'rgba(255,0,0,0.1)', borderRadius: 10 },
  disconnectText: { color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 'bold' }
});