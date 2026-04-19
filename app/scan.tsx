import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, TextInput } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useRemoteControl } from '../src/context/RemoteControlContext';

const SCAN_SIZE = 250;

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [manualSessionId, setManualSessionId] = useState('');
  const { joinTVSession } = useRemoteControl();

  const connectToSession = async (sessionId: string) => {
    const normalizedId = sessionId.trim();
    if (!normalizedId) {
      Alert.alert('Error', 'Please enter a session ID');
      return;
    }

    try {
      await joinTVSession(normalizedId);
      Alert.alert('Connected!', 'Your phone is now connected to the TV.', [
        {
          text: 'Start',
          onPress: () => router.replace('/(tabs)/outfit'),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Connection Failed', error?.message || 'Could not connect to TV session');
      setScanned(false);
    }
  };

  const handleBarCodeScanned = async ({ data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);

    try {
      const parsed = JSON.parse(data);
      if (parsed.type === 'tv-remote' && parsed.sessionId) {
        await connectToSession(parsed.sessionId);
      } else {
        Alert.alert('Invalid QR', 'This QR code is not a valid TV session code.');
        setScanned(false);
      }
    } catch {
      Alert.alert('Error', 'Could not read QR code. Please try again.');
      setScanned(false);
    }
  };

  const handleManualConnect = async () => {
    await connectToSession(manualSessionId);
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.message}>Requesting camera permission...</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionBox}>
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            Camera permission is needed for QR scanning. You can still use manual connect below.
          </Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>Grant Permission</Text>
          </TouchableOpacity>

          <View style={styles.manualConnectContainer}>
            <Text style={styles.manualConnectTitle}>Manual Connect</Text>
            <TextInput
              style={styles.sessionIdInput}
              placeholder="Enter Session ID from TV"
              placeholderTextColor="#777"
              autoCapitalize="none"
              autoCorrect={false}
              value={manualSessionId}
              onChangeText={setManualSessionId}
            />
            <TouchableOpacity style={styles.connectBtn} onPress={handleManualConnect}>
              <Text style={styles.connectBtnText}>Connect to TV</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        <View style={styles.overlay}>
          <View style={styles.topOverlay}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
              <Text style={styles.closeBtnText}>X</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.middleRow}>
            <View style={styles.sideOverlay} />
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            <View style={styles.sideOverlay} />
          </View>

          <View style={styles.bottomOverlay}>
            <Text style={styles.scanText}>Point your camera at the QR code on the TV</Text>
            {scanned ? (
              <TouchableOpacity style={styles.rescanBtn} onPress={() => setScanned(false)}>
                <Text style={styles.rescanBtnText}>Scan Again</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </CameraView>

      <View style={styles.manualConnectContainer}>
        <Text style={styles.manualConnectTitle}>Manual Connect</Text>
        <TextInput
          style={styles.sessionIdInput}
          placeholder="Enter Session ID from TV"
          placeholderTextColor="#777"
          autoCapitalize="none"
          autoCorrect={false}
          value={manualSessionId}
          onChangeText={setManualSessionId}
        />
        <TouchableOpacity style={styles.connectBtn} onPress={handleManualConnect}>
          <Text style={styles.connectBtnText}>Connect to TV</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  message: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
  permissionBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  permissionTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionText: {
    color: '#aaa',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  permissionBtn: {
    backgroundColor: '#D4A843',
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  permissionBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  backBtn: {
    paddingVertical: 10,
  },
  backBtnText: {
    color: '#888',
    fontSize: 14,
  },
  overlay: {
    flex: 1,
  },
  topOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 20,
    paddingRight: 20,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  middleRow: {
    flexDirection: 'row',
    height: SCAN_SIZE,
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  scanFrame: {
    width: SCAN_SIZE,
    height: SCAN_SIZE,
    borderWidth: 0,
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#D4A843',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  bottomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  scanText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 24,
  },
  rescanBtn: {
    marginTop: 20,
    backgroundColor: '#D4A843',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  rescanBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  manualConnectContainer: {
    backgroundColor: 'rgba(0,0,0,0.9)',
    padding: 20,
    width: '100%',
  },
  manualConnectTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  sessionIdInput: {
    height: 44,
    borderColor: '#D4A843',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#fff',
    marginBottom: 10,
  },
  connectBtn: {
    backgroundColor: '#D4A843',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  connectBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
