import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Type, Spacing, BorderRadius } from '@/theme';
import Icon from '@/components/Icon';
import { PRODUCTS } from '@/data/mockProducts';

export default function ScanScreen() {
  const router = useRouter();
  const [flashOn, setFlashOn] = useState(false);

  const handleSimulateScan = (batchId: string = 'AYUR-ASH-2026-000458') => {
    router.push(`/verify/${batchId}` as any);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <Text style={styles.brandMark}>AYUTRACE+</Text>
        <Text style={styles.headerTitle}>Scan AyurTrace+ QR</Text>
        <Text style={styles.headerSubtitle}>Place the product QR inside the frame.</Text>
      </View>

      {/* Main Camera Viewfinder Simulation */}
      <View style={styles.viewfinderContainer}>
        <View style={styles.darkOverlayTop} />

        <View style={styles.scanRow}>
          <View style={styles.darkOverlaySide} />

          {/* Scanner Frame */}
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />

            <View style={styles.animatedScanLine} />

            <Icon name="qr-code-outline" size={80} color={Colors.white + '30'} />
          </View>

          <View style={styles.darkOverlaySide} />
        </View>

        <View style={styles.darkOverlayBottom}>
          <Text style={styles.instructionText}>Align the QR code inside the frame</Text>

          {/* Quick Demo Scan Shortcuts */}
          <View style={styles.demoPillsRow}>
            <TouchableOpacity
              style={styles.demoPill}
              onPress={() => handleSimulateScan('AYUR-ASH-2026-000458')}
            >
              <Text style={styles.demoPillText}>Scan Ashwagandha</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.demoPill, { backgroundColor: Colors.errorContainer }]}
              onPress={() => handleSimulateScan('AYUR-TRI-2026-000099')}
            >
              <Text style={[styles.demoPillText, { color: Colors.error }]}>Scan Recalled Batch</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.demoPill, { backgroundColor: Colors.tertiaryFixed }]}
              onPress={() => router.push('/qr-not-found')}
            >
              <Text style={[styles.demoPillText, { color: Colors.warning }]}>Scan Invalid QR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Bottom Bar Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.actionItem}
          onPress={() => setFlashOn(!flashOn)}
        >
          <View style={[styles.actionCircle, flashOn && styles.actionActive]}>
            <Icon name={flashOn ? 'flash' : 'flash-outline'} size={20} color={flashOn ? Colors.primary : Colors.white} />
          </View>
          <Text style={styles.actionLabel}>Flash</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionItem}
          onPress={() => handleSimulateScan('AYUR-TUL-2026-000271')}
        >
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
  demoPillsRow: {
    marginTop: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.md,
  },
  demoPill: {
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
  },
  demoPillText: {
    ...Type.labelMd,
    color: Colors.onSecondaryContainer,
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
