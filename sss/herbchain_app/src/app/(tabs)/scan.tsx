import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { CameraView, useCameraPermissions, Camera, type BarcodeScanningResult } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Type, Spacing, BorderRadius } from '@/theme';
import Icon from '@/components/Icon';

export default function ScanScreen() {
  const router = useRouter();
  const [flashOn, setFlashOn] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [isActive, setIsActive] = useState(true);
  const [pickingFromGallery, setPickingFromGallery] = useState(false);
  const scannedRef = useRef(false);

  // Pause scanning while this tab isn't focused, and reset the "already
  // scanned" guard when it comes back into focus (e.g. returning from
  // qr-not-found via "Scan Again").
  useFocusEffect(
    React.useCallback(() => {
      scannedRef.current = false;
      setIsActive(true);
      return () => setIsActive(false);
    }, [])
  );

  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    if (scannedRef.current || !result.data) return;
    scannedRef.current = true;
    setIsActive(false);
    router.push(`/verify/${encodeURIComponent(result.data)}` as any);
  };

  const handleGalleryPick = async () => {
    if (pickingFromGallery) return;
    setPickingFromGallery(true);
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Photo access needed', 'Allow photo access to scan a QR code from your gallery.');
        return;
      }

      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });
      if (picked.canceled || !picked.assets?.[0]) return;

      const results = await Camera.scanFromURLAsync(picked.assets[0].uri, ['qr']);
      if (!results.length) {
        Alert.alert('No QR Code Found', 'That photo doesn’t contain a valid QR code. Please choose a photo with a clear, valid QR code.');
        return;
      }
      router.push(`/verify/${encodeURIComponent(results[0].data)}` as any);
    } catch {
      Alert.alert('No QR Code Found', 'That photo doesn’t contain a valid QR code. Please choose a photo with a clear, valid QR code.');
    } finally {
      setPickingFromGallery(false);
    }
  };

  const renderCamera = () => {
    if (!permission) return <View style={styles.viewfinderContainer} />;

    if (!permission.granted) {
      return (
        <View style={[styles.viewfinderContainer, styles.permissionWrap]}>
          <Icon name="camera-outline" size={48} color={Colors.white} />
          <Text style={styles.permissionText}>
            AyurTrace+ needs camera access to scan product QR codes.
          </Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>Grant Camera Access</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.viewfinderContainer}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={flashOn}
          active={isActive}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={isActive ? handleBarcodeScanned : undefined}
        />

        {/* Overlay: a flex column filling the same space as the camera
            behind it, so the middle band's fixed height lines up with the
            scan frame regardless of screen size. */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={styles.darkOverlayTop} />
          <View style={styles.scanRow}>
            <View style={styles.darkOverlaySide} />
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              <View style={styles.animatedScanLine} />
            </View>
            <View style={styles.darkOverlaySide} />
          </View>
          <View style={styles.darkOverlayBottom}>
            <Text style={styles.instructionText}>Align the QR code inside the frame</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <Text style={styles.brandMark}>AYUTRACE+</Text>
        <Text style={styles.headerTitle}>Scan AyurTrace+ QR</Text>
        <Text style={styles.headerSubtitle}>Place the product QR inside the frame.</Text>
      </View>

      {renderCamera()}

      {/* Bottom Bar Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.actionItem}
          onPress={() => setFlashOn(!flashOn)}
          disabled={!permission?.granted}
        >
          <View style={[styles.actionCircle, flashOn && styles.actionActive]}>
            <Icon name={flashOn ? 'flash' : 'flash-outline'} size={20} color={flashOn ? Colors.primary : Colors.white} />
          </View>
          <Text style={styles.actionLabel}>Flash</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem} onPress={handleGalleryPick} disabled={pickingFromGallery}>
          <View style={styles.actionCircle}>
            <Icon name="image-outline" size={20} color={Colors.white} />
          </View>
          <Text style={styles.actionLabel}>Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionItem}
          onPress={() => router.push('/verify/manual')}
        >
          <View style={styles.actionCircle}>
            <Icon name="keypad-outline" size={20} color={Colors.white} />
          </View>
          <Text style={styles.actionLabel}>Batch ID</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionItem}
          onPress={() => alert('Point your phone camera directly at the QR code printed on the Ayurvedic product packaging.')}
        >
          <View style={styles.actionCircle}>
            <Icon name="help-circle-outline" size={20} color={Colors.white} />
          </View>
          <Text style={styles.actionLabel}>Help</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryContainer,
  },
  headerRow: {
    paddingHorizontal: Spacing.gutter,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    alignItems: 'center',
  },
  brandMark: {
    ...Type.headlineSm,
    color: Colors.primaryFixed,
    letterSpacing: 0.5,
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    ...Type.headlineMd,
    color: Colors.primaryFixed,
    textAlign: 'center',
  },
  headerSubtitle: {
    ...Type.bodyMd,
    color: Colors.onPrimaryContainer,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  viewfinderContainer: {
    flex: 1,
  },
  permissionWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  permissionText: {
    ...Type.bodyMd,
    color: Colors.white,
    textAlign: 'center',
  },
  permissionBtn: {
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
  },
  permissionBtnText: {
    ...Type.labelMd,
    color: Colors.onSecondaryContainer,
  },
  darkOverlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  scanRow: {
    flexDirection: 'row',
    height: 260,
  },
  darkOverlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  scanFrame: {
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  // Gold "scanning frame" corners with the softened radius of the shape language.
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: Colors.onTertiaryContainer,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 5,
    borderLeftWidth: 5,
    borderTopLeftRadius: BorderRadius.xl,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 5,
    borderRightWidth: 5,
    borderTopRightRadius: BorderRadius.xl,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 5,
    borderLeftWidth: 5,
    borderBottomLeftRadius: BorderRadius.xl,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 5,
    borderRightWidth: 5,
    borderBottomRightRadius: BorderRadius.xl,
  },
  animatedScanLine: {
    position: 'absolute',
    top: '40%',
    left: 14,
    right: 14,
    height: 2,
    backgroundColor: Colors.onTertiaryContainer,
    shadowColor: Colors.onTertiaryContainer,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  darkOverlayBottom: {
    flex: 1.5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  instructionText: {
    ...Type.bodyMd,
    color: Colors.primaryFixed,
    textAlign: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.primary,
  },
  actionItem: {
    alignItems: 'center',
  },
  actionCircle: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  actionActive: {
    backgroundColor: Colors.onTertiaryContainer,
  },
  actionLabel: {
    ...Type.labelMd,
    color: Colors.primaryFixed,
  },
});
